'use client';

import { useCallback, useRef, useState } from 'react';
import axios, { type AxiosResponse } from 'axios';
import { UploadValidationError } from './upload-limits';
import type { UploadOptions } from './file-upload';

export type UploadFn<T, Args extends any[]> = (
    ...args: [...Args, UploadOptions?]
) => Promise<AxiosResponse<T>>;

export interface UseUploadState<T> {
    /** 0-100, or null when idle. Updates on xhr progress events. */
    pct: number | null;
    /** Most recent error — validation, network, or abort. Cleared on new upload. */
    error: Error | null;
    /** True while a request is in flight. */
    uploading: boolean;
    /** True if the last attempt was cancelled by the user. */
    aborted: boolean;
    /** The resolved response data from the last successful upload. */
    data: T | null;
}

export interface UseUploadReturn<T, Args extends any[]> extends UseUploadState<T> {
    /**
     * Start an upload. Returns the axios response data, or rejects with the
     * caught error. Calling this while an upload is in flight aborts the
     * previous one first.
     */
    upload: (...args: Args) => Promise<T>;
    /** Cancel the in-flight upload (if any). No-op when idle. */
    abort: () => void;
    /** Reset state to idle (pct=null, error=null, data=null, aborted=false). */
    reset: () => void;
}

/**
 * Bind any `fileUploadApi.*` method to local UI state: progress %, error,
 * cancel support. Designed to be called in a component once and reused.
 *
 * Example:
 *   const { upload, pct, error, uploading, abort } = useUpload(
 *       fileUploadApi.uploadRepairRequestVideo,
 *   );
 *   ...
 *   await upload(file, requestId);
 *   <ProgressBar value={pct ?? 0} />
 *   <Button onClick={abort} disabled={!uploading}>Отмена</Button>
 */
export function useUpload<T, Args extends any[]>(
    fn: UploadFn<T, Args>,
): UseUploadReturn<T, Args> {
    const [pct, setPct] = useState<number | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [uploading, setUploading] = useState(false);
    const [aborted, setAborted] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const ctrlRef = useRef<AbortController | null>(null);

    const abort = useCallback(() => {
        if (ctrlRef.current) {
            ctrlRef.current.abort();
            ctrlRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        setPct(null);
        setError(null);
        setUploading(false);
        setAborted(false);
        setData(null);
    }, []);

    const upload = useCallback(
        async (...args: Args): Promise<T> => {
            // Cancel any prior in-flight upload.
            if (ctrlRef.current) ctrlRef.current.abort();

            const ctrl = new AbortController();
            ctrlRef.current = ctrl;

            setPct(0);
            setError(null);
            setUploading(true);
            setAborted(false);
            setData(null);

            try {
                const opts: UploadOptions = {
                    onProgress: setPct,
                    signal: ctrl.signal,
                };
                const res = await fn(...args, opts);
                if (ctrlRef.current === ctrl) ctrlRef.current = null;
                setData(res.data);
                setPct(100);
                return res.data;
            } catch (e) {
                if (ctrlRef.current === ctrl) ctrlRef.current = null;

                // Axios exposes several shapes for cancellations; normalize.
                if (
                    axios.isCancel(e) ||
                    (e instanceof Error && (e.name === 'AbortError' || e.name === 'CanceledError'))
                ) {
                    setAborted(true);
                    const abortErr = new Error('Загрузка отменена');
                    abortErr.name = 'AbortError';
                    setError(abortErr);
                    throw abortErr;
                }

                if (e instanceof UploadValidationError) {
                    setError(e);
                    throw e;
                }

                const err = e instanceof Error ? e : new Error(String(e));
                setError(err);
                throw err;
            } finally {
                setUploading(false);
            }
        },
        [fn],
    );

    return { pct, error, uploading, aborted, data, upload, abort, reset };
}
