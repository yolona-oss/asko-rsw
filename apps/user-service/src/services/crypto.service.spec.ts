import CryptoService from './crypto.service';

describe('CryptoService', () => {
    describe('createPasswordHash', () => {
        it('should return a string in "salt.hash" format', async () => {
            const result = await CryptoService.createPasswordHash('myPassword123');

            expect(typeof result).toBe('string');
            const dotIndex = result.indexOf('.');
            expect(dotIndex).toBeGreaterThan(0);

            const salt = result.substring(0, dotIndex);
            const hash = result.substring(dotIndex + 1);

            // Salt should be 32 bytes = 64 hex chars
            expect(salt).toHaveLength(64);
            expect(salt).toMatch(/^[0-9a-f]{64}$/);

            // Hash should be a valid argon2 hash
            expect(hash).toMatch(/^\$argon2id\$/);
        });

        it('should produce different hashes for the same password (random salt)', async () => {
            const hash1 = await CryptoService.createPasswordHash('samePassword');
            const hash2 = await CryptoService.createPasswordHash('samePassword');
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePasswords', () => {
        it('should return true for the correct password', async () => {
            const password = 'correctHorse42!';
            const stored = await CryptoService.createPasswordHash(password);
            const result = await CryptoService.comparePasswords(password, stored);
            expect(result).toBe(true);
        });

        it('should return false for a wrong password', async () => {
            const stored = await CryptoService.createPasswordHash('realPassword');
            const result = await CryptoService.comparePasswords('wrongPassword', stored);
            expect(result).toBe(false);
        });

        it('should return false for a malformed stored string (no dot)', async () => {
            const result = await CryptoService.comparePasswords('anything', 'nodothere');
            expect(result).toBe(false);
        });

        it('should return false for an empty stored string', async () => {
            const result = await CryptoService.comparePasswords('anything', '');
            expect(result).toBe(false);
        });

        it('should return false for a corrupted argon2 hash', async () => {
            const result = await CryptoService.comparePasswords(
                'anything',
                'aa'.repeat(32) + '.notavalidargonhash',
            );
            expect(result).toBe(false);
        });
    });

    describe('createTokenHash', () => {
        it('should return a consistent hex string for the same input', () => {
            const hash1 = CryptoService.createTokenHash('myToken');
            const hash2 = CryptoService.createTokenHash('myToken');
            expect(hash1).toBe(hash2);
        });

        it('should return a 128-character hex string (SHA-512)', () => {
            const hash = CryptoService.createTokenHash('testValue');
            expect(hash).toHaveLength(128);
            expect(hash).toMatch(/^[0-9a-f]{128}$/);
        });

        it('should return different hashes for different inputs', () => {
            const hash1 = CryptoService.createTokenHash('tokenA');
            const hash2 = CryptoService.createTokenHash('tokenB');
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('calculateEntropy', () => {
        it('should detect lowercase only (alphabet length 26)', () => {
            const result = CryptoService.calculateEntropy('abc');
            expect(result.alphabetLength).toBe(26);
            expect(result.alphabetsUsed.size).toBe(1);
            // entropy = log2(26^3) = 3 * log2(26)
            expect(result.entropy).toBeCloseTo(3 * Math.log2(26), 10);
        });

        it('should detect uppercase only (alphabet length 26)', () => {
            const result = CryptoService.calculateEntropy('ABC');
            expect(result.alphabetLength).toBe(26);
            expect(result.alphabetsUsed.size).toBe(1);
        });

        it('should detect digits only (alphabet length 10)', () => {
            const result = CryptoService.calculateEntropy('123');
            expect(result.alphabetLength).toBe(10);
            expect(result.alphabetsUsed.size).toBe(1);
            expect(result.entropy).toBeCloseTo(3 * Math.log2(10), 10);
        });

        it('should detect mixed lowercase + uppercase (alphabet length 52)', () => {
            const result = CryptoService.calculateEntropy('aB');
            expect(result.alphabetLength).toBe(52);
            expect(result.alphabetsUsed.size).toBe(2);
            expect(result.entropy).toBeCloseTo(2 * Math.log2(52), 10);
        });

        it('should detect all character sets (alphabet length 93)', () => {
            // lowercase + uppercase + digit + special
            const result = CryptoService.calculateEntropy('aA1!');
            expect(result.alphabetLength).toBe(26 + 26 + 10 + 31);
            expect(result.alphabetsUsed.size).toBe(4);
            expect(result.entropy).toBeCloseTo(4 * Math.log2(93), 10);
        });

        it('should return 0 entropy for empty string', () => {
            const result = CryptoService.calculateEntropy('');
            expect(result.alphabetLength).toBe(0);
            // Math.pow(0, 0) = 1, Math.log2(1) = 0
            expect(result.entropy).toBe(0);
        });

        it('should scale entropy with password length', () => {
            const short = CryptoService.calculateEntropy('ab');
            const long = CryptoService.calculateEntropy('abcdef');
            expect(long.entropy).toBeGreaterThan(short.entropy);
            // Same alphabet, so alphabetLength should be the same
            expect(short.alphabetLength).toBe(long.alphabetLength);
        });
    });
});
