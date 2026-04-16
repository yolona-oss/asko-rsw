import { AppErrors } from '@asko/shared';
import type { UploadChunk, UploadStart } from '@asko/proto';
import type { Readable } from 'node:stream';
import { lastValueFrom, Observable, Subject } from 'rxjs';

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1 MiB

export interface StreamUploadOptions {
    /** Hard byte cap for the uploaded file. Aborts the stream if exceeded. */
    maxBytes: number;
    /** Max bytes per emitted gRPC message. Defaults to 1 MiB. */
    chunkSize?: number;
}

/**
 * Drive a client-streaming gRPC upload from a Node Readable:
 *   1. Emit the `UploadStart` metadata chunk first.
 *   2. Re-slice each incoming buffer into `chunkSize` gRPC messages.
 *   3. Count bytes; abort the stream + RPC if it exceeds `maxBytes`.
 *   4. Complete the RPC when the source stream ends.
 *
 * The RPC's server-side response is awaited and returned.
 */
export async function grpcStreamUpload<Resp>(
    rpc: (chunks$: Observable<UploadChunk>) => Observable<Resp>,
    source: Readable,
    start: UploadStart,
    opts: StreamUploadOptions,
): Promise<Resp> {
    const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunks$ = new Subject<UploadChunk>();
    let received = 0;
    let aborted = false;

    // Emit UploadStart before any data chunks. Use queueMicrotask so the RPC
    // subscription can attach before the first value is produced.
    queueMicrotask(() => {
        if (!aborted) chunks$.next({ start });
    });

    const onData = (buf: Buffer) => {
        if (aborted) return;
        received += buf.length;
        if (received > opts.maxBytes) {
            aborted = true;
            source.destroy(AppErrors.badRequest('File exceeds maximum upload size'));
            chunks$.error(AppErrors.badRequest('File exceeds maximum upload size'));
            return;
        }
        for (let off = 0; off < buf.length; off += chunkSize) {
            const end = Math.min(off + chunkSize, buf.length);
            chunks$.next({ data: buf.subarray(off, end) });
        }
    };

    const onEnd = () => {
        if (!aborted) chunks$.complete();
    };

    const onError = (err: Error) => {
        if (!aborted) {
            aborted = true;
            chunks$.error(err);
        }
    };

    source.on('data', onData);
    source.once('end', onEnd);
    source.once('error', onError);

    try {
        return await lastValueFrom(rpc(chunks$.asObservable()));
    } finally {
        source.off('data', onData);
        source.off('end', onEnd);
        source.off('error', onError);
    }
}
