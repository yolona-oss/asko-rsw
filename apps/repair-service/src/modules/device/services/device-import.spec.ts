jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('common/error', () => {
    class MockAppError extends Error {
        public httpStatus: number;
        constructor(status: number, options?: { message?: string }) {
            super(options?.message ?? 'AppError');
            this.httpStatus = status;
        }
    }
    return {
        AppErrors: {
            badRequest: (msg?: string) => new MockAppError(400, { message: msg }),
            dbEntityNotFound: (msg?: string) => new MockAppError(404, { message: msg }),
        },
    };
});

jest.mock('entities', () => ({
    Device: class Device {},
    DeviceCategory: class DeviceCategory {},
    UserDevice: class UserDevice {},
    Address: class Address {},
    DevicePart: class DevicePart {},
}));

jest.mock('@asko/shared', () => ({
    slugify: (input: string) =>
        input
            .toLowerCase()
            .replace(/[^a-z0-9а-яё\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''),
}));

jest.mock('modules/shared-services/services/signature.service', () => ({
    SignatureService: jest.fn(),
}));

jest.mock('modules/user-device-validation.service', () => ({
    UserDeviceValidationPublisher: jest.fn(),
}));

import { DeviceService } from './device.service';

function createMockEm() {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn((_entity: any, data: any) => ({ id: 'new-id', ...data })),
        persist: jest.fn(),
        persistAndFlush: jest.fn(),
        flush: jest.fn(),
        removeAndFlush: jest.fn(),
        count: jest.fn(),
        getReference: jest.fn((_entity: any, id: string) => ({ id })),
    };
}

describe('DeviceService — importDevices', () => {
    let service: DeviceService;
    let mockEm: ReturnType<typeof createMockEm>;
    const mockSignatureService = {} as any;
    const mockValidationPublisher = { emit: jest.fn() } as any;

    beforeEach(() => {
        mockEm = createMockEm();
        service = new DeviceService(mockEm as any, mockSignatureService, mockValidationPublisher);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('imports a single device successfully', async () => {
        const category = { id: 'cat-1', name: 'washing_machine' };
        mockEm.findOne
            .mockResolvedValueOnce(null)      // slug check — no existing
            .mockResolvedValueOnce(category);  // category lookup

        const product = {
            name: 'Стиральная машина Asko W1084BW',
            type: 'washing_machine',
            model: 'W1084BW',
            brand: 'Asko',
            description: 'Some description',
            specifications: {
                technical: { 'Высота, см': '85' },
                features: { 'Гарантия': '24' },
                images: ['https://example.com/img1.jpg', 'https://example.com/vid.webm'],
            },
        };

        const result = await service.importDevices([product]);

        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(0);
        expect(result.importedDevices).toHaveLength(1);
        // .webm filtered out
        expect(result.importedDevices[0].imageUrls).toEqual(['https://example.com/img1.jpg']);
        expect(mockEm.create).toHaveBeenCalledTimes(1);
        expect(mockEm.persist).toHaveBeenCalledTimes(1);
        expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });

    it('skips device with duplicate slug', async () => {
        const existing = { id: 'dev-existing', slug: 'asko-w1084bw-some' };
        mockEm.findOne.mockResolvedValueOnce(existing); // slug check — found

        const result = await service.importDevices([
            { name: 'Device', model: 'W1084BW', brand: 'Asko', type: 'washing_machine' },
        ]);

        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(1);
        expect(mockEm.create).not.toHaveBeenCalled();
    });

    it('skips device when no category found at all', async () => {
        mockEm.findOne
            .mockResolvedValueOnce(null)   // slug check
            .mockResolvedValueOnce(null)   // category by type
            .mockResolvedValueOnce(null);  // fallback "other" category

        const result = await service.importDevices([
            { name: 'Device', model: 'X', brand: 'B', type: 'unknown_type' },
        ]);

        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(1);
    });

    it('falls back to "other" category when type not found', async () => {
        const otherCat = { id: 'cat-other', name: 'other' };
        mockEm.findOne
            .mockResolvedValueOnce(null)      // slug check
            .mockResolvedValueOnce(null)      // category by type
            .mockResolvedValueOnce(otherCat); // fallback "other"

        const result = await service.importDevices([
            { name: 'Unknown device', model: 'U1', brand: 'Asko', type: 'nonexistent' },
        ]);

        expect(result.imported).toBe(1);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ category: otherCat }),
        );
    });

    it('imports multiple devices, counts imported and skipped separately', async () => {
        const category = { id: 'cat-1', name: 'oven' };

        // Device 1: new
        mockEm.findOne
            .mockResolvedValueOnce(null)      // slug check
            .mockResolvedValueOnce(category); // category
        // Device 2: duplicate slug
        mockEm.findOne
            .mockResolvedValueOnce({ id: 'dup' }); // slug check — exists
        // Device 3: new
        mockEm.findOne
            .mockResolvedValueOnce(null)      // slug check
            .mockResolvedValueOnce(category); // category

        const products = [
            { name: 'Oven A', model: 'OA1', brand: 'Asko', type: 'oven' },
            { name: 'Oven B', model: 'OB1', brand: 'Asko', type: 'oven' },
            { name: 'Oven C', model: 'OC1', brand: 'Asko', type: 'oven' },
        ];

        const result = await service.importDevices(products);

        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(1);
        expect(result.importedDevices).toHaveLength(2);
        expect(mockEm.flush).toHaveBeenCalledTimes(1); // single flush at the end
    });

    it('handles missing optional fields with defaults', async () => {
        const category = { id: 'cat-1', name: 'other' };
        mockEm.findOne
            .mockResolvedValueOnce(null)      // slug check
            .mockResolvedValueOnce(category); // category

        const result = await service.importDevices([
            { type: 'other' }, // no name, model, brand
        ]);

        expect(result.imported).toBe(1);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                name: '',
                model: '',
                brand: '',
                isFeatured: false,
            }),
        );
    });

    it('filters out .webm URLs from images', async () => {
        const category = { id: 'cat-1', name: 'fridge' };
        mockEm.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(category);

        const result = await service.importDevices([{
            name: 'Fridge', model: 'F1', brand: 'Asko', type: 'fridge',
            specifications: {
                images: ['a.jpg', 'b.webm', 'c.png', 'd.webm'],
            },
        }]);

        expect(result.importedDevices[0].imageUrls).toEqual(['a.jpg', 'c.png']);
    });

    it('assigns random price when no price provided', async () => {
        const category = { id: 'cat-1', name: 'other' };
        mockEm.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(category);

        await service.importDevices([
            { name: 'Dev', model: 'D1', brand: 'B', type: 'other' },
        ]);

        const createCall = mockEm.create.mock.calls[0][1];
        expect(createCall.price).toBeGreaterThanOrEqual(10000);
        expect(createCall.price).toBeLessThanOrEqual(200001);
    });

    it('returns empty results for empty input', async () => {
        const result = await service.importDevices([]);

        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.importedDevices).toEqual([]);
        expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });
});

describe('DeviceService — importDeviceParts', () => {
    let service: DeviceService;
    let mockEm: ReturnType<typeof createMockEm>;
    const mockSignatureService = {} as any;
    const mockValidationPublisher = { emit: jest.fn() } as any;

    beforeEach(() => {
        mockEm = createMockEm();
        service = new DeviceService(mockEm as any, mockSignatureService, mockValidationPublisher);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('imports a part linked to an existing device', async () => {
        const device = { id: 'dev-1', name: 'Стиральная машина', slug: 'asko-w1084bw-...' };
        const category = { id: 'cat-1', name: 'washing_machine' };

        mockEm.findOne
            .mockResolvedValueOnce(device)    // device by slug
            .mockResolvedValueOnce(category); // category by name

        const result = await service.importDeviceParts([{
            deviceModel: 'W1084BW',
            deviceBrand: 'Asko',
            deviceName: 'Стиральная машина Asko W1084BW',
            categoryName: 'washing_machine',
            name: 'Электродвигатель (мотор)',
            partNumber: 'W1084BW-001',
            price: 18000,
            group: 'Привод и мотор',
            description: 'Бесщеточный электродвигатель BLDC',
        }]);

        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(0);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                device,
                category,
                name: 'Электродвигатель (мотор)',
                partNumber: 'W1084BW-001',
                price: 18000,
                group: 'Привод и мотор',
                description: 'Бесщеточный электродвигатель BLDC',
            }),
        );
        expect(mockEm.persist).toHaveBeenCalledTimes(1);
        expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });

    it('skips part when device not found by slug', async () => {
        mockEm.findOne.mockResolvedValueOnce(null); // device not found

        const result = await service.importDeviceParts([{
            deviceModel: 'NONEXISTENT',
            deviceBrand: 'Asko',
            deviceName: 'Unknown',
            name: 'Some part',
        }]);

        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(1);
        expect(mockEm.create).not.toHaveBeenCalled();
    });

    it('imports a generic part (no device reference)', async () => {
        const category = { id: 'cat-1', name: 'washing_machine' };
        mockEm.findOne.mockResolvedValueOnce(category); // category lookup only

        const result = await service.importDeviceParts([{
            categoryName: 'washing_machine',
            name: 'Универсальный ТЭН',
            price: 2500,
            group: 'Нагрев',
        }]);

        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(0);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                device: undefined,
                category,
                name: 'Универсальный ТЭН',
            }),
        );
    });

    it('imports part without category when categoryName not provided', async () => {
        // No device fields, no category → no findOne calls needed for those
        const result = await service.importDeviceParts([{
            name: 'Generic bolt',
            price: 100,
        }]);

        expect(result.imported).toBe(1);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                device: undefined,
                category: undefined,
                name: 'Generic bolt',
            }),
        );
    });

    it('imports part even when category not found — category stays undefined', async () => {
        mockEm.findOne.mockResolvedValueOnce(null); // category not found

        const result = await service.importDeviceParts([{
            categoryName: 'nonexistent_category',
            name: 'Mystery part',
        }]);

        expect(result.imported).toBe(1);
        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                category: undefined,
            }),
        );
    });

    it('imports multiple parts, counts imported and skipped', async () => {
        const device = { id: 'dev-1', slug: 'some-slug' };
        const category = { id: 'cat-1', name: 'oven' };

        // Part 1: device found, category found
        mockEm.findOne
            .mockResolvedValueOnce(device)
            .mockResolvedValueOnce(category);
        // Part 2: device NOT found → skip
        mockEm.findOne
            .mockResolvedValueOnce(null);
        // Part 3: device found, no categoryName → no category lookup
        mockEm.findOne
            .mockResolvedValueOnce(device);

        const parts = [
            { deviceModel: 'OT8664S', deviceBrand: 'Asko', deviceName: 'Oven A', categoryName: 'oven', name: 'ТЭН верхний' },
            { deviceModel: 'MISSING', deviceBrand: 'Asko', deviceName: 'Missing', name: 'Part X' },
            { deviceModel: 'OT8664S', deviceBrand: 'Asko', deviceName: 'Oven A', name: 'Термостат' },
        ];

        const result = await service.importDeviceParts(parts);

        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(1);
        expect(mockEm.persist).toHaveBeenCalledTimes(2);
        expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });

    it('handles missing optional fields with defaults', async () => {
        const device = { id: 'dev-1' };
        mockEm.findOne.mockResolvedValueOnce(device); // device found

        await service.importDeviceParts([{
            deviceModel: 'X1',
            deviceBrand: 'B',
            deviceName: 'D',
            name: 'Bolt',
            // no partNumber, price, description, group, categoryName
        }]);

        expect(mockEm.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                device,
                category: undefined,
                name: 'Bolt',
                partNumber: undefined,
                price: undefined,
                description: undefined,
                group: undefined,
            }),
        );
    });

    it('returns empty results for empty input', async () => {
        const result = await service.importDeviceParts([]);

        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(0);
        expect(mockEm.flush).toHaveBeenCalledTimes(1);
    });

    it('catches thrown errors per-entry and counts as skipped', async () => {
        // Force findOne to throw on first call, succeed on second
        mockEm.findOne
            .mockRejectedValueOnce(new Error('DB connection lost'))
            .mockResolvedValueOnce({ id: 'dev-1' }); // device found for part 2

        const result = await service.importDeviceParts([
            { deviceModel: 'X', deviceBrand: 'B', deviceName: 'D', name: 'Part 1' },
            { deviceModel: 'Y', deviceBrand: 'B', deviceName: 'D', name: 'Part 2' },
        ]);

        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(1);
    });

    it('resolves device only when at least one device field is present', async () => {
        // Only deviceBrand provided (no model/name) — should still trigger lookup
        mockEm.findOne
            .mockResolvedValueOnce({ id: 'dev-1' }); // device found

        const result = await service.importDeviceParts([{
            deviceBrand: 'Asko',
            name: 'Filter',
        }]);

        expect(result.imported).toBe(1);
        // findOne was called (device lookup happened)
        expect(mockEm.findOne).toHaveBeenCalledTimes(1);
    });
});
