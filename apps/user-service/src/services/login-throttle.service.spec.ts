import { Test, TestingModule } from '@nestjs/testing';
import { LoginThrottleService } from './login-throttle.service';

describe('LoginThrottleService', () => {
    let service: LoginThrottleService;
    let redisMock: {
        ttl: jest.Mock;
        get: jest.Mock;
        incr: jest.Mock;
        expire: jest.Mock;
        del: jest.Mock;
    };

    beforeEach(async () => {
        redisMock = {
            ttl: jest.fn(),
            get: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            del: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoginThrottleService,
                {
                    provide: 'REDIS_CLIENT',
                    useValue: redisMock,
                },
            ],
        }).compile();

        service = module.get<LoginThrottleService>(LoginThrottleService);
    });

    describe('isLocked', () => {
        it('should return 0 when TTL <= 0', async () => {
            redisMock.ttl.mockResolvedValue(-1);

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(0);
            expect(redisMock.ttl).toHaveBeenCalledWith('login:fail:user@example.com');
        });

        it('should return 0 when TTL is 0', async () => {
            redisMock.ttl.mockResolvedValue(0);

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(0);
        });

        it('should return TTL when attempts >= 5 and TTL > 0', async () => {
            redisMock.ttl.mockResolvedValue(600);
            redisMock.get.mockResolvedValue('5');

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(600);
        });

        it('should return TTL when attempts > 5 and TTL > 0', async () => {
            redisMock.ttl.mockResolvedValue(450);
            redisMock.get.mockResolvedValue('7');

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(450);
        });

        it('should return 0 when attempts < 5 even with TTL > 0', async () => {
            redisMock.ttl.mockResolvedValue(800);
            redisMock.get.mockResolvedValue('3');

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(0);
        });

        it('should return 0 when attempts is null (key exists but no value)', async () => {
            redisMock.ttl.mockResolvedValue(500);
            redisMock.get.mockResolvedValue(null);

            const result = await service.isLocked('user@example.com');
            expect(result).toBe(0);
        });

        it('should lowercase the email for key lookup', async () => {
            redisMock.ttl.mockResolvedValue(-1);

            await service.isLocked('User@EXAMPLE.com');
            expect(redisMock.ttl).toHaveBeenCalledWith('login:fail:user@example.com');
        });
    });

    describe('recordFailure', () => {
        it('should increment and set expiry on first attempt', async () => {
            redisMock.incr.mockResolvedValue(1);

            const result = await service.recordFailure('user@example.com');

            expect(redisMock.incr).toHaveBeenCalledWith('login:fail:user@example.com');
            expect(redisMock.expire).toHaveBeenCalledWith('login:fail:user@example.com', 900);
            expect(result).toBe(false);
        });

        it('should not set expiry on subsequent attempts below threshold', async () => {
            redisMock.incr.mockResolvedValue(3);

            const result = await service.recordFailure('user@example.com');

            expect(redisMock.incr).toHaveBeenCalled();
            // expire should not be called for attempts !== 1 and < 5
            expect(redisMock.expire).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        it('should return true when attempts reach 5', async () => {
            redisMock.incr.mockResolvedValue(5);

            const result = await service.recordFailure('user@example.com');

            expect(result).toBe(true);
            expect(redisMock.expire).toHaveBeenCalledWith('login:fail:user@example.com', 900);
        });

        it('should return true when attempts exceed 5', async () => {
            redisMock.incr.mockResolvedValue(8);

            const result = await service.recordFailure('user@example.com');

            expect(result).toBe(true);
            expect(redisMock.expire).toHaveBeenCalledWith('login:fail:user@example.com', 900);
        });

        it('should return false when under 5 attempts', async () => {
            redisMock.incr.mockResolvedValue(4);

            const result = await service.recordFailure('user@example.com');
            expect(result).toBe(false);
        });

        it('should set expiry on both first attempt and lockout', async () => {
            // First call: first attempt
            redisMock.incr.mockResolvedValue(1);
            await service.recordFailure('user@example.com');
            expect(redisMock.expire).toHaveBeenCalledTimes(1);

            redisMock.expire.mockClear();

            // Second call: lockout at 5
            redisMock.incr.mockResolvedValue(5);
            await service.recordFailure('user@example.com');
            expect(redisMock.expire).toHaveBeenCalledTimes(1);
        });
    });

    describe('resetAttempts', () => {
        it('should delete the key', async () => {
            redisMock.del.mockResolvedValue(1);

            await service.resetAttempts('user@example.com');

            expect(redisMock.del).toHaveBeenCalledWith('login:fail:user@example.com');
        });

        it('should lowercase the email', async () => {
            redisMock.del.mockResolvedValue(1);

            await service.resetAttempts('User@EXAMPLE.COM');

            expect(redisMock.del).toHaveBeenCalledWith('login:fail:user@example.com');
        });
    });

    describe('remainingAttempts', () => {
        it('should return 5 when no attempts recorded', async () => {
            redisMock.get.mockResolvedValue(null);

            const result = await service.remainingAttempts('user@example.com');
            expect(result).toBe(5);
        });

        it('should return correct remaining when some attempts used', async () => {
            redisMock.get.mockResolvedValue('3');

            const result = await service.remainingAttempts('user@example.com');
            expect(result).toBe(2);
        });

        it('should return 0 when all attempts used', async () => {
            redisMock.get.mockResolvedValue('5');

            const result = await service.remainingAttempts('user@example.com');
            expect(result).toBe(0);
        });

        it('should return 0 when attempts exceed max (never negative)', async () => {
            redisMock.get.mockResolvedValue('10');

            const result = await service.remainingAttempts('user@example.com');
            expect(result).toBe(0);
        });

        it('should lowercase the email for key lookup', async () => {
            redisMock.get.mockResolvedValue('0');

            await service.remainingAttempts('Test@Email.COM');
            expect(redisMock.get).toHaveBeenCalledWith('login:fail:test@email.com');
        });
    });
});
