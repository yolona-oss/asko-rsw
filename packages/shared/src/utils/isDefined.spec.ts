import { isDefined } from './isDefined';

describe('isDefined', () => {
    it('returns true for number 0', () => {
        expect(isDefined(0)).toBe(true);
    });

    it('returns true for empty string', () => {
        expect(isDefined('')).toBe(true);
    });

    it('returns true for false', () => {
        expect(isDefined(false)).toBe(true);
    });

    it('returns true for empty object', () => {
        expect(isDefined({})).toBe(true);
    });

    it('returns true for empty array', () => {
        expect(isDefined([])).toBe(true);
    });

    it('returns true for a non-empty string', () => {
        expect(isDefined('hello')).toBe(true);
    });

    it('returns false for null', () => {
        expect(isDefined(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isDefined(undefined)).toBe(false);
    });

    it('works as an array filter to remove null and undefined', () => {
        const input: (number | null | undefined)[] = [0, 1, null, 3, undefined, 5];
        const result = input.filter(isDefined);
        expect(result).toEqual([0, 1, 3, 5]);
    });

    it('narrows types correctly when used as a filter', () => {
        const input: (string | null)[] = ['a', null, 'b', null];
        const result = input.filter(isDefined);
        expect(result).toEqual(['a', 'b']);
    });
});
