import { FileVisibility } from '@asko/shared';
import { hasAccessParams, toAccessParams } from '../file-access.types';

describe('toAccessParams', () => {
    it('returns all-undefined when every field is empty', () => {
        expect(toAccessParams({})).toEqual({
            creatorId: undefined,
            visibility: undefined,
            conversationId: undefined,
        });
    });

    it('maps a valid visibility string to its enum member', () => {
        const out = toAccessParams({ visibility: 'role_restricted' });
        expect(out.visibility).toBe(FileVisibility.ROLE_RESTRICTED);
    });

    it('drops a bogus visibility string to undefined', () => {
        const out = toAccessParams({ visibility: 'not-a-real-visibility' });
        expect(out.visibility).toBeUndefined();
    });

    it.each([
        FileVisibility.PUBLIC,
        FileVisibility.PRIVATE,
        FileVisibility.ROLE_RESTRICTED,
        FileVisibility.PARTICIPANTS_ONLY,
    ])('recognizes known visibility value %s', (v) => {
        expect(toAccessParams({ visibility: v }).visibility).toBe(v);
    });

    it('treats empty-string inputs as undefined', () => {
        const out = toAccessParams({
            creatorId: '',
            visibility: '',
            conversationId: '',
        });
        expect(out).toEqual({
            creatorId: undefined,
            visibility: undefined,
            conversationId: undefined,
        });
    });

    it('passes through non-empty creatorId and conversationId', () => {
        const out = toAccessParams({
            creatorId: 'u-1',
            conversationId: 'c-1',
        });
        expect(out.creatorId).toBe('u-1');
        expect(out.conversationId).toBe('c-1');
    });
});

describe('hasAccessParams', () => {
    it('returns false for undefined input', () => {
        expect(hasAccessParams(undefined)).toBe(false);
    });

    it('returns false when every field is undefined', () => {
        expect(hasAccessParams({})).toBe(false);
    });

    it('returns true when creatorId is set', () => {
        expect(hasAccessParams({ creatorId: 'u-1' })).toBe(true);
    });

    it('returns true when visibility is set', () => {
        expect(hasAccessParams({ visibility: FileVisibility.PRIVATE })).toBe(true);
    });

    it('returns true when conversationId is set', () => {
        expect(hasAccessParams({ conversationId: 'c-1' })).toBe(true);
    });
});
