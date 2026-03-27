jest.mock('storage/storage-provider.interface', () => ({
    STORAGE_PROVIDER: Symbol('STORAGE_PROVIDER'),
}));

import { ImageProcessingService } from './image-processing.service';
import { CloudinaryUploadResult, ImageSizes } from './cloudinary.service';

describe('ImageProcessingService', () => {
    let service: ImageProcessingService;
    let mockStorage: {
        uploadImage: jest.Mock;
        uploadImageBuffer: jest.Mock;
        deleteImage: jest.Mock;
        deleteImages: jest.Mock;
        generateThumbnail: jest.Mock;
        generateMultipleSizes: jest.Mock;
    };

    const createMockUploadResult = (overrides?: Partial<CloudinaryUploadResult>): CloudinaryUploadResult => ({
        public_id: 'test-public-id',
        version: 1,
        signature: 'test-sig',
        width: 1920,
        height: 1080,
        format: 'jpg',
        resource_type: 'image',
        url: 'http://example.com/image.jpg',
        secure_url: 'https://example.com/image.jpg',
        original_filename: 'test-image',
        ...overrides,
    });

    const createMockFile = (overrides?: Partial<Express.Multer.File>): Express.Multer.File => ({
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/tmp',
        filename: 'test.jpg',
        path: '/tmp/test.jpg',
        buffer: Buffer.from('fake-image-data'),
        stream: null as any,
    });

    beforeEach(() => {
        mockStorage = {
            uploadImage: jest.fn(),
            uploadImageBuffer: jest.fn(),
            deleteImage: jest.fn(),
            deleteImages: jest.fn(),
            generateThumbnail: jest.fn(),
            generateMultipleSizes: jest.fn(),
        };
        service = new ImageProcessingService(mockStorage as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('processUserAvatar', () => {
        it('uploads the file and creates a 150x150 thumbnail', async () => {
            const original = createMockUploadResult({ public_id: 'avatars/avatar-1' });
            const thumbnailUrl = 'https://example.com/avatar-thumb.jpg';

            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateThumbnail.mockResolvedValue(thumbnailUrl);

            const file = createMockFile();
            const result = await service.processUserAvatar(file);

            expect(mockStorage.uploadImage).toHaveBeenCalledWith(file, 'avatars');
            expect(mockStorage.generateThumbnail).toHaveBeenCalledWith(
                original.secure_url,
                150,
                150,
            );

            expect(result.original).toBe(original);
            expect(result.thumbnail).toBeDefined();
            expect(result.thumbnail!.secure_url).toBe(thumbnailUrl);
            expect(result.thumbnail!.url).toBe(thumbnailUrl);
            expect(result.thumbnail!.width).toBe(150);
            expect(result.thumbnail!.height).toBe(150);
        });

        it('preserves original metadata in thumbnail', async () => {
            const original = createMockUploadResult({
                public_id: 'avatars/avatar-2',
                format: 'png',
                resource_type: 'image',
            });
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateThumbnail.mockResolvedValue('https://example.com/thumb.png');

            const result = await service.processUserAvatar(createMockFile());

            expect(result.thumbnail!.format).toBe('png');
            expect(result.thumbnail!.resource_type).toBe('image');
            expect(result.thumbnail!.public_id).toBe('avatars/avatar-2');
        });

        it('does not produce medium or large sizes', async () => {
            const original = createMockUploadResult();
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateThumbnail.mockResolvedValue('https://example.com/thumb.jpg');

            const result = await service.processUserAvatar(createMockFile());

            expect(result.medium).toBeUndefined();
            expect(result.large).toBeUndefined();
        });
    });

    describe('processProductImage', () => {
        it('uploads the file and creates 3 sizes (thumbnail, medium, large)', async () => {
            const original = createMockUploadResult({ public_id: 'products/prod-1' });
            const sizes = {
                thumbnail: 'https://example.com/prod-thumb.jpg',
                medium: 'https://example.com/prod-medium.jpg',
                large: 'https://example.com/prod-large.jpg',
            };

            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateMultipleSizes.mockResolvedValue(sizes);

            const file = createMockFile();
            const result = await service.processProductImage(file);

            expect(mockStorage.uploadImage).toHaveBeenCalledWith(file, 'products');
            expect(mockStorage.generateMultipleSizes).toHaveBeenCalledWith(original.secure_url);

            expect(result.original).toBe(original);
        });

        it('creates thumbnail at 150x150', async () => {
            const original = createMockUploadResult();
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateMultipleSizes.mockResolvedValue({
                thumbnail: 'https://example.com/thumb.jpg',
                medium: 'https://example.com/medium.jpg',
                large: 'https://example.com/large.jpg',
            });

            const result = await service.processProductImage(createMockFile());

            expect(result.thumbnail).toBeDefined();
            expect(result.thumbnail!.secure_url).toBe('https://example.com/thumb.jpg');
            expect(result.thumbnail!.url).toBe('https://example.com/thumb.jpg');
            expect(result.thumbnail!.width).toBe(150);
            expect(result.thumbnail!.height).toBe(150);
        });

        it('creates medium at 400x300', async () => {
            const original = createMockUploadResult();
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateMultipleSizes.mockResolvedValue({
                thumbnail: 'https://example.com/thumb.jpg',
                medium: 'https://example.com/medium.jpg',
                large: 'https://example.com/large.jpg',
            });

            const result = await service.processProductImage(createMockFile());

            expect(result.medium).toBeDefined();
            expect(result.medium!.secure_url).toBe('https://example.com/medium.jpg');
            expect(result.medium!.url).toBe('https://example.com/medium.jpg');
            expect(result.medium!.width).toBe(400);
            expect(result.medium!.height).toBe(300);
        });

        it('creates large at 800x600', async () => {
            const original = createMockUploadResult();
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateMultipleSizes.mockResolvedValue({
                thumbnail: 'https://example.com/thumb.jpg',
                medium: 'https://example.com/medium.jpg',
                large: 'https://example.com/large.jpg',
            });

            const result = await service.processProductImage(createMockFile());

            expect(result.large).toBeDefined();
            expect(result.large!.secure_url).toBe('https://example.com/large.jpg');
            expect(result.large!.url).toBe('https://example.com/large.jpg');
            expect(result.large!.width).toBe(800);
            expect(result.large!.height).toBe(600);
        });

        it('preserves original metadata in all generated sizes', async () => {
            const original = createMockUploadResult({
                public_id: 'products/prod-2',
                format: 'webp',
                signature: 'sig-123',
            });
            mockStorage.uploadImage.mockResolvedValue(original);
            mockStorage.generateMultipleSizes.mockResolvedValue({
                thumbnail: 'https://example.com/thumb.webp',
                medium: 'https://example.com/medium.webp',
                large: 'https://example.com/large.webp',
            });

            const result = await service.processProductImage(createMockFile());

            for (const size of [result.thumbnail!, result.medium!, result.large!]) {
                expect(size.public_id).toBe('products/prod-2');
                expect(size.format).toBe('webp');
                expect(size.signature).toBe('sig-123');
            }
        });
    });

    describe('deleteImageFiles', () => {
        it('deletes all image sizes by their public_ids', async () => {
            const imageSizes: ImageSizes = {
                original: createMockUploadResult({ public_id: 'img-original' }),
                thumbnail: createMockUploadResult({ public_id: 'img-thumb' }),
                medium: createMockUploadResult({ public_id: 'img-medium' }),
                large: createMockUploadResult({ public_id: 'img-large' }),
            };
            mockStorage.deleteImages.mockResolvedValue(undefined);

            await service.deleteImageFiles(imageSizes);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith([
                'img-original',
                'img-thumb',
                'img-medium',
                'img-large',
            ]);
        });

        it('deletes only existing sizes (original + thumbnail)', async () => {
            const imageSizes: ImageSizes = {
                original: createMockUploadResult({ public_id: 'img-original' }),
                thumbnail: createMockUploadResult({ public_id: 'img-thumb' }),
            };
            mockStorage.deleteImages.mockResolvedValue(undefined);

            await service.deleteImageFiles(imageSizes);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith([
                'img-original',
                'img-thumb',
            ]);
        });

        it('does not call deleteImages when there are no valid entries', async () => {
            // ImageSizes with only falsy values filtered out
            // Since original is required by the type, we test the edge case
            // where object values are somehow falsy by casting
            const imageSizes = {
                original: null,
            } as unknown as ImageSizes;

            await service.deleteImageFiles(imageSizes);

            expect(mockStorage.deleteImages).not.toHaveBeenCalled();
        });

        it('handles original-only image sizes', async () => {
            const imageSizes: ImageSizes = {
                original: createMockUploadResult({ public_id: 'only-original' }),
            };
            mockStorage.deleteImages.mockResolvedValue(undefined);

            await service.deleteImageFiles(imageSizes);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith(['only-original']);
        });
    });
});
