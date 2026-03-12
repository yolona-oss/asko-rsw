import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { ImageService } from './image.service';
import { ImageProcessingService } from './image-processing.service';
import { CloudinaryService } from './cloudinary.service';
import { Image } from 'entities';
import { ImageObj, CloudinaryImage } from 'entities/image.obj';
import { ImageTypeEnum, AttachImageDto, UploadImageDto } from '@asko/shared';
import { AppErrors } from 'common/error';

describe('ImageService', () => {
    let service: ImageService;
    let em: EntityManager;
    let imgProcessor: ImageProcessingService;
    let cloudinary: CloudinaryService;
    let orm: MikroORM;

    // Mock Cloudinary image response
    const mockCloudinaryImage: CloudinaryImage = {
        public_id: 'test_public_id',
        version: 1234567890,
        signature: 'test_signature',
        width: 800,
        height: 600,
        format: 'jpg',
        resource_type: 'image',
        url: 'http://example.com/image.jpg',
        secure_url: 'https://example.com/image.jpg',
        original_filename: 'test_image',
    };

    // Mock ImageObj
    const mockImageObj: ImageObj = {
        original: mockCloudinaryImage,
        thumbnail: mockCloudinaryImage,
        medium: mockCloudinaryImage,
        large: mockCloudinaryImage,
    };

    // Mock Multer file
    const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImageService,
                {
                    provide: EntityManager,
                    useValue: {
                        persistAndFlush: jest.fn(),
                        removeAndFlush: jest.fn(),
                        findOne: jest.fn(),
                        findOneOrFail: jest.fn(),
                        find: jest.fn(),
                        count: jest.fn(),
                        fork: jest.fn().mockReturnThis(),
                    },
                },
                {
                    provide: ImageProcessingService,
                    useValue: {
                        processUserAvatar: jest.fn(),
                        processProductImage: jest.fn(),
                    },
                },
                {
                    provide: CloudinaryService,
                    useValue: {
                        uploadImage: jest.fn(),
                        uploadStream: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ImageService>(ImageService);
        em = module.get<EntityManager>(EntityManager);
        imgProcessor = module.get<ImageProcessingService>(ImageProcessingService);
        cloudinary = module.get<CloudinaryService>(CloudinaryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('upload', () => {
        it('should upload an image successfully', async () => {
            const dto: UploadImageDto = { alt: 'Test image' };
            jest.spyOn(cloudinary, 'uploadImage').mockResolvedValue(mockCloudinaryImage);

            const result = await service.upload(mockFile, dto);

            expect(cloudinary.uploadImage).toHaveBeenCalledWith(mockFile);
            expect(result).toBeInstanceOf(Image);
            expect(result.image.original).toEqual(mockCloudinaryImage);
            expect(result.alt).toBe('Test image');
            expect(result.order).toBe(0);
            expect(em.persistAndFlush).toHaveBeenCalledWith(result);
        });

        it('should handle upload errors', async () => {
            const dto: UploadImageDto = { alt: 'Test image' };
            jest.spyOn(cloudinary, 'uploadImage').mockRejectedValue(new Error('Upload failed'));

            await expect(service.upload(mockFile, dto)).rejects.toThrow('Upload failed');
        });
    });

    // describe('streamUpload', () => {
    //     it('should upload image via stream successfully', async () => {
    //         const dto: UploadImageDto = { alt: 'Stream image' };
    //         jest.spyOn(cloudinary, 'uploadStream').mockResolvedValue(mockCloudinaryImage);
    //
    //         const result = await service.streamUpload(mockFile, dto);
    //
    //         expect(cloudinary.uploadStream).toHaveBeenCalledWith(mockFile.stream, mockFile.mimetype);
    //         expect(result.image.original).toEqual(mockCloudinaryImage);
    //         expect(result.alt).toBe('Stream image');
    //     });
    //
    //     it('should throw error when uploadStream returns null', async () => {
    //         const dto: UploadImageDto = { alt: 'Stream image' };
    //         jest.spyOn(cloudinary, 'uploadStream').mockResolvedValue(null);
    //
    //         await expect(service.streamUpload(mockFile, dto)).rejects.toThrow('Unable to upload image');
    //     });
    // });

    describe('uploadUserAvatar', () => {
        it('should upload user avatar successfully', async () => {
            const ownerId = 'user-123';
            jest.spyOn(imgProcessor, 'processUserAvatar').mockResolvedValue(mockImageObj);

            const result = await service.uploadUserAvatar(mockFile, ownerId);

            expect(imgProcessor.processUserAvatar).toHaveBeenCalledWith(mockFile);
            expect(result.image).toEqual(mockImageObj);
            expect(result.ownerType).toBe(ImageTypeEnum.User);
            expect(result.ownerId).toBe(ownerId);
            expect(em.persistAndFlush).toHaveBeenCalled();
        });
    });

    describe('uploadProductImage', () => {
        it('should upload product image successfully', async () => {
            const ownerId = 'product-456';
            jest.spyOn(imgProcessor, 'processProductImage').mockResolvedValue(mockImageObj);

            const result = await service.uploadProductImage(mockFile, ownerId);

            expect(imgProcessor.processProductImage).toHaveBeenCalledWith(mockFile);
            expect(result.image).toEqual(mockImageObj);
            expect(result.ownerType).toBe(ImageTypeEnum.Product);
            expect(result.ownerId).toBe(ownerId);
        });
    });

    describe('uploadBlankImage', () => {
        it('should upload blank user image', async () => {
            jest.spyOn(imgProcessor, 'processUserAvatar').mockResolvedValue(mockImageObj);

            const result = await service.uploadBlankImage(mockFile, ImageTypeEnum.User);

            expect(imgProcessor.processUserAvatar).toHaveBeenCalledWith(mockFile);
            expect(result.image).toEqual(mockImageObj);
            expect(result.blankType).toBe(ImageTypeEnum.User);
        });

        it('should upload blank product image', async () => {
            jest.spyOn(imgProcessor, 'processProductImage').mockResolvedValue(mockImageObj);

            const result = await service.uploadBlankImage(mockFile, ImageTypeEnum.Product);

            expect(imgProcessor.processProductImage).toHaveBeenCalledWith(mockFile);
            expect(result.blankType).toBe(ImageTypeEnum.Product);
        });

        it('should throw error for invalid image type', async () => {
            await expect(
                service.uploadBlankImage(mockFile, 'InvalidType' as ImageTypeEnum)
            ).rejects.toThrow('Invalid image type');
        });
    });

    describe('reorderImages', () => {
        it('should reorder images successfully', async () => {
            const ownerType = ImageTypeEnum.Product;
            const ownerId = 'product-123';

            const image0 = Object.assign(new Image(), { id: 'img-0', order: 0, ownerType, ownerId });
            const image1 = Object.assign(new Image(), { id: 'img-1', order: 1, ownerType, ownerId });
            const image2 = Object.assign(new Image(), { id: 'img-2', order: 2, ownerType, ownerId });
            const image3 = Object.assign(new Image(), { id: 'img-3', order: 3, ownerType, ownerId });
            const image4 = Object.assign(new Image(), { id: 'img-4', order: 4, ownerType, ownerId });
            const image5 = Object.assign(new Image(), { id: 'img-5', order: 5, ownerType, ownerId });
            const image6 = Object.assign(new Image(), { id: 'img-6', order: 6, ownerType, ownerId });
            const image7 = Object.assign(new Image(), { id: 'img-7', order: 7, ownerType, ownerId });
            const image8 = Object.assign(new Image(), { id: 'img-8', order: 8, ownerType, ownerId });
            const image9 = Object.assign(new Image(), { id: 'img-9', order: 9, ownerType, ownerId });

            jest.spyOn(em, 'find').mockResolvedValue([image0, image1, image2, image4, image5, image6, image9]);

            const schema = [
                { id: 'img-2', order: 0 },
                { id: 'img-0', order: 1 },
                { id: 'img-1', order: 2 },
                { id: 'img-9', order: 5 }
            ];

            await service.reorderImages(ownerType, ownerId, schema);

            expect(em.persistAndFlush).toHaveBeenCalledWith([image0, image1, image2, image4, image5, image6, image9]);
            expect(image2.order).toBe(0);
            expect(image0.order).toBe(1);
            expect(image1.order).toBe(2);
            expect(image4.order).toBe(4);
            expect(image5.order).toBe(9);
            expect(image6.order).toBe(6);
            expect(image9.order).toBe(5);
        });

        it('should throw error when schema has more items than attached images', async () => {
            const ownerType = ImageTypeEnum.Product;
            const ownerId = 'product-123';

            const image0 = Object.assign(new Image(), { id: 'img-0', order: 0, ownerType, ownerId });

            jest.spyOn(em, 'find').mockResolvedValue([image0]);

            const schema = [
                { id: 'img-1', order: 0 },
                { id: 'img-2', order: 1 },
            ];

            await expect(service.reorderImages(ownerType, ownerId, schema)).rejects.toThrow(
                'not enough source images'
            );
        });

        it('should throw error for duplicate IDs in schema', async () => {
            const ownerType = ImageTypeEnum.Product;
            const ownerId = 'product-123';

            const image1 = Object.assign(new Image(), { id: 'img-1', order: 0 });
            const image2 = Object.assign(new Image(), { id: 'img-2', order: 1 });

            jest.spyOn(em, 'find').mockResolvedValue([image1, image2]);

            const schema = [
                { id: 'img-1', order: 0 },
                { id: 'img-1', order: 1 }, // Duplicate ID
            ];

            await expect(service.reorderImages(ownerType, ownerId, schema)).rejects.toThrow(
                'Input order schema is invalid'
            );
        });
    });

    describe('remove', () => {
        it('should remove an image successfully', async () => {
            const imageId = 'img-123';
            const image = new Image();
            image.id = imageId;

            jest.spyOn(em, 'findOne').mockResolvedValue(image);

            await service.remove(imageId);

            expect(em.findOne).toHaveBeenCalledWith(Image, { id: imageId });
            expect(em.removeAndFlush).toHaveBeenCalledWith(image);
        });

        it('should throw error when image not found', async () => {
            const imageId = 'nonexistent';
            jest.spyOn(em, 'findOne').mockResolvedValue(null);

            await expect(service.remove(imageId)).rejects.toThrow(`Image ${imageId} not found`);
        });
    });

    describe('unattachImage', () => {
        it('should unattach an image and reorder remaining images', async () => {
            const imageId = 'img-1';
            const image = Object.assign(new Image(), {
                id: imageId,
                ownerType: ImageTypeEnum.Product,
                ownerId: 'product-123',
                order: 1,
            });

            const remaining1 = Object.assign(new Image(), { id: 'img-2', order: 0 });
            const remaining2 = Object.assign(new Image(), { id: 'img-3', order: 2 });

            jest.spyOn(em, 'findOne').mockResolvedValue(image);
            jest.spyOn(em, 'find').mockResolvedValue([remaining1, remaining2]);

            await service.unattachImage(imageId);

            expect(image.ownerId).toBeUndefined();
            expect(image.ownerType).toBeUndefined();
            expect(remaining1.order).toBe(0);
            expect(remaining2.order).toBe(1);
        });

        it('should throw error when image is not attached', async () => {
            const imageId = 'img-1';
            const image = Object.assign(new Image(), { id: imageId });

            jest.spyOn(em, 'findOne').mockResolvedValue(image);

            await expect(service.unattachImage(imageId)).rejects.toThrow('not attached');
        });
    });

    describe('attachImage', () => {
        it('should attach an image successfully', async () => {
            const imageId = 'img-123';
            const image = new Image();
            image.id = imageId;

            const dto: AttachImageDto = {
                ownerId: 'product-456',
                ownerType: ImageTypeEnum.Product as any,
            };

            jest.spyOn(em, 'findOne').mockResolvedValue(image);
            jest.spyOn(em, 'count').mockResolvedValue(3);

            const result = await service.attachImage(imageId, dto);

            expect(result.ownerId).toBe('product-456');
            expect(result.ownerType).toBe(ImageTypeEnum.Product);
            expect(result.order).toBe(3);
            expect(em.persistAndFlush).toHaveBeenCalledWith(image);
        });
    });

    describe('countAttached', () => {
        it('should count attached images', async () => {
            const ownerId = 'product-123';
            const ownerType = ImageTypeEnum.Product;

            jest.spyOn(em, 'count').mockResolvedValue(5);

            const count = await service.countAttached(ownerId, ownerType);

            expect(count).toBe(5);
            expect(em.count).toHaveBeenCalledWith(Image, { ownerId, ownerType });
        });
    });

    describe('findAttachedImages', () => {
        it('should find and return attached images ordered by order field', async () => {
            const ownerType = ImageTypeEnum.Product;
            const ownerId = 'product-123';

            const images = [
                Object.assign(new Image(), { id: 'img-1', order: 0 }),
                Object.assign(new Image(), { id: 'img-2', order: 1 }),
            ];

            jest.spyOn(em, 'find').mockResolvedValue(images);

            const result = await service.findAttachedImages(ownerType, ownerId);

            expect(result).toEqual(images);
            expect(em.find).toHaveBeenCalledWith(
                Image,
                { ownerType, ownerId },
                { orderBy: { order: 'ASC' } }
            );
        });
    });

    describe('findBlank', () => {
        it('should find blank image by type', async () => {
            const blankType = ImageTypeEnum.User;
            const image = new Image();

            jest.spyOn(em, 'findOneOrFail').mockResolvedValue(image);

            const result = await service.findBlank(blankType);

            expect(result).toBe(image);
            expect(em.findOneOrFail).toHaveBeenCalledWith(Image, { blankType });
        });
    });

    describe('createBlank', () => {
        it('should create blank image when none exists', async () => {
            const blankType = ImageTypeEnum.Product;

            jest.spyOn(em, 'findOne').mockResolvedValue(null);
            jest.spyOn(imgProcessor, 'processProductImage').mockResolvedValue(mockImageObj);

            await service.createBlank(mockFile, blankType);

            expect(em.findOne).toHaveBeenCalledWith(Image, { blankType });
            expect(imgProcessor.processProductImage).toHaveBeenCalledWith(mockFile);
            expect(em.persistAndFlush).toHaveBeenCalled();
        });

        it('should throw error when blank already exists', async () => {
            const blankType = ImageTypeEnum.Product;
            const existingImage = new Image();

            jest.spyOn(em, 'findOne').mockResolvedValue(existingImage);

            await expect(service.createBlank(mockFile, blankType)).rejects.toThrow(
                'Blank image already exists'
            );
        });
    });

    describe('updateBlank', () => {
        it('should update existing blank image', async () => {
            const blankType = ImageTypeEnum.Product;
            const image = new Image();

            jest.spyOn(em, 'findOneOrFail').mockResolvedValue(image);
            jest.spyOn(imgProcessor, 'processProductImage').mockResolvedValue(mockImageObj);

            await service.updateBlank(mockFile, blankType);

            expect(em.findOneOrFail).toHaveBeenCalledWith(Image, { blankType });
            expect(imgProcessor.processProductImage).toHaveBeenCalledWith(mockFile);
            expect(image.image).toEqual(mockImageObj);
            expect(em.persistAndFlush).toHaveBeenCalledWith(image);
        });
    });
});
