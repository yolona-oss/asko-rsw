import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { AppErrors, msg } from '@asko/shared';
import Busboy from 'busboy';
import type { Readable } from 'node:stream';
import type { Observable } from 'rxjs';

/**
 * The payload attached to `req.streamingUpload` for the handler to consume.
 * The `stream` is the raw multipart file stream — forward it to the gRPC
 * streaming client without buffering.
 */
export interface StreamingUploadPayload {
    stream: Readable;
    filename: string;
    mimeType: string;
    fields: Record<string, string>;
}

/**
 * Bypasses Multer's memory buffer and exposes the multipart file as a Node
 * Readable stream. The request-body stream is parsed with Busboy; the
 * handler receives the file stream via `@StreamingFile()` and pipes it
 * directly into the gRPC client-streaming upload.
 *
 * Behavior:
 *   - Accepts exactly one file part (`limits: { files: 1 }`). Additional
 *     file parts are rejected.
 *   - Resolves the handler once the `file` event fires (headers parsed,
 *     bytes ready to flow) — the stream is still open at this point.
 *   - Non-file form fields are collected into `payload.fields`.
 *   - Rejects fast with 413 if `Content-Length` exceeds the configured
 *     limit (best-effort, before any bytes are read).
 */
@Injectable()
export class StreamingUploadInterceptor implements NestInterceptor {
    /** Optional hard cap on Content-Length (in bytes) — 413 if exceeded. */
    constructor(private readonly maxBytes?: number) {}

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
        const req = ctx.switchToHttp().getRequest();

        if (this.maxBytes !== undefined) {
            const contentLength = Number(req.headers['content-length'] ?? '0');
            if (contentLength > this.maxBytes) {
                throw AppErrors.badRequest({ key: msg.file.exceedsMaxSize });
            }
        }

        const busboy = Busboy({
            headers: req.headers,
            limits: { files: 1 },
        });

        const fields: Record<string, string> = {};
        busboy.on('field', (name, value) => {
            fields[name] = value;
        });

        return new Promise<Observable<any>>((resolve, reject) => {
            let resolved = false;

            busboy.on('file', (_name, fileStream, info) => {
                if (resolved) {
                    // A second file part — drain it and reject.
                    fileStream.resume();
                    reject(AppErrors.badRequest({ key: msg.file.onlyOneFile }));
                    return;
                }
                resolved = true;

                const payload: StreamingUploadPayload = {
                    stream: fileStream,
                    filename: info.filename,
                    mimeType: info.mimeType,
                    fields,
                };
                req.streamingUpload = payload;
                resolve(next.handle());
            });

            busboy.on('error', (err) => {
                if (!resolved) {
                    resolved = true;
                    reject(err);
                }
            });

            busboy.on('finish', () => {
                if (!resolved) {
                    resolved = true;
                    reject(AppErrors.badRequest({ key: msg.file.noFilePart }));
                }
            });

            req.pipe(busboy);
        });
    }
}
