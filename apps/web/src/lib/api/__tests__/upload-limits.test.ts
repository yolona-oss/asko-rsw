import { describe, it, expect } from 'vitest';
import { assertUploadLimit, UploadValidationError, UPLOAD_LIMITS } from '../upload-limits';

const MB = 1024 * 1024;

describe('assertUploadLimit', () => {
    it('accepts a valid avatar', () => {
        const f = new File([new Uint8Array(1 * MB)], 'a.jpg', { type: 'image/jpeg' });
        expect(() => assertUploadLimit(f, 'avatar')).not.toThrow();
    });

    it('rejects oversize avatar', () => {
        const f = new File([new Uint8Array(6 * MB)], 'a.jpg', { type: 'image/jpeg' });
        expect(() => assertUploadLimit(f, 'avatar')).toThrow(UploadValidationError);
    });

    it('rejects wrong mime for image', () => {
        const f = new File(['x'], 'a.gif', { type: 'image/gif' });
        expect(() => assertUploadLimit(f, 'image')).toThrow(UploadValidationError);
    });

    it('accepts an mp4 video under 100 MB', () => {
        const f = new File([new Uint8Array(50 * MB)], 'v.mp4', { type: 'video/mp4' });
        expect(() => assertUploadLimit(f, 'video')).not.toThrow();
    });

    it('rejects a 150 MB video', () => {
        const f = new File([new Uint8Array(150 * MB)], 'v.mp4', { type: 'video/mp4' });
        expect(() => assertUploadLimit(f, 'video')).toThrow(UploadValidationError);
    });

    it('accepts a PDF under 20 MB for documents', () => {
        const f = new File([new Uint8Array(1 * MB)], 'doc.pdf', { type: 'application/pdf' });
        expect(() => assertUploadLimit(f, 'document')).not.toThrow();
    });

    it('accepts a docx under 20 MB for documents', () => {
        const f = new File([new Uint8Array(1 * MB)], 'd.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        expect(() => assertUploadLimit(f, 'document')).not.toThrow();
    });

    it('error is instance of UploadValidationError (not generic Error)', () => {
        const f = new File([new Uint8Array(200 * MB)], 'v.mp4', { type: 'video/mp4' });
        try {
            assertUploadLimit(f, 'video');
        } catch (e) {
            expect(e).toBeInstanceOf(UploadValidationError);
            expect((e as Error).name).toBe('UploadValidationError');
            return;
        }
        throw new Error('expected throw');
    });
});

describe('UPLOAD_LIMITS shape', () => {
    it('has avatar, image, video, document kinds', () => {
        expect(Object.keys(UPLOAD_LIMITS).sort()).toEqual(['avatar', 'document', 'image', 'video']);
    });

    it('sizes are strictly ordered: avatar < image < document < video', () => {
        expect(UPLOAD_LIMITS.avatar.maxBytes).toBeLessThan(UPLOAD_LIMITS.image.maxBytes);
        expect(UPLOAD_LIMITS.image.maxBytes).toBeLessThan(UPLOAD_LIMITS.document.maxBytes);
        expect(UPLOAD_LIMITS.document.maxBytes).toBeLessThan(UPLOAD_LIMITS.video.maxBytes);
    });
});
