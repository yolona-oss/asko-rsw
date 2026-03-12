import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import { ImageProcessingService } from "./image-processing.service";
import { CloudinaryService } from "./cloudinary.service";
import { AttachImageDto, ImagesReorderSchemaDto, ImageTypeEnum, UploadImageDto } from "@asko/shared";
import { Image } from 'entities/image.entity'
import { ImageObj } from "entities/image.obj";
import { AppErrors } from "common/error";
import * as multer from 'multer'

@Injectable()
export class ImageService {
    constructor(
        private readonly em: EntityManager,
        private readonly imgProcessor: ImageProcessingService,
        private readonly cloudinary: CloudinaryService
    ) {}

    async upload(file: Express.Multer.File, dto: UploadImageDto) {
        const imageObj = await this.cloudinary.uploadImage(file);
        const image = new Image();
        image.image = {
            original: imageObj,
        };
        image.alt = dto.alt;
        image.order = 0
        await this.em.persistAndFlush(image);

        return image;
    }

    async streamUpload(file: Express.Multer.File, dto: UploadImageDto) {
        const imageObj = await this.cloudinary.uploadStream(file.stream, file.mimetype);
        if (!imageObj) {
            throw AppErrors.externalServiceUnavailable('Unable to upload image');
        }
        const image = new Image();
        image.image = {
            original: imageObj,
        };
        image.alt = dto.alt;
        image.order = 0
        await this.em.persistAndFlush(image);

        return image;
    }

    async uploadUserAvatar(file: Express.Multer.File, ownerId: string) {
        const imageObj = await this.imgProcessor.processUserAvatar(file);
        const image = new Image();

        image.image = imageObj;
        image.ownerType = ImageTypeEnum.User;
        image.ownerId = String(ownerId);
        image.order = 0

        await this.em.persistAndFlush(image);

        return image;
    }

    async uploadProductImage(file: Express.Multer.File, ownerId: string) {
        const imageObj = await this.imgProcessor.processProductImage(file);
        const image = new Image();

        image.image = imageObj;
        image.ownerType = ImageTypeEnum.Product;
        image.ownerId = String(ownerId);
        image.order = 0

        await this.em.persistAndFlush(image);

        return image;
    }

    async uploadBlankImage(file: Express.Multer.File, type: ImageTypeEnum) {
        let imageObj: ImageObj

        if (type === ImageTypeEnum.User) {
            imageObj = await this.imgProcessor.processUserAvatar(file);
        } else if (type === ImageTypeEnum.Product) {
            imageObj = await this.imgProcessor.processProductImage(file);
        } else {
            throw AppErrors.badRequest('Invalid image type');
        }

        const image = new Image();

        image.image = imageObj;
        image.blankType = type;
        image.order = 0

        await this.em.persistAndFlush(image);

        return image;
    }

    /***
    * changes order of attached images by new schema.
    * if schema and target images has pairs its use common swap mechanism, otherwise its swap it implicitly with displacement of 
    */
    async reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: ImagesReorderSchemaDto) {
        const targets = await this.findAttachedImages(ownerType, ownerId)

        schema.sort((a, b) => a.order - b.order);

        {
            if (targets.length < schema.length) {
                throw AppErrors.badRequest('Input order schema is invalid: not enough source images');
            }

            const isUniq = (a: any[]) => a.length === new Set(a).size;
            const ids = schema.map(i => i.id);
            const order_nums = schema.map(i => i.order);
            if (!isUniq(ids) || !isUniq(order_nums)) {
                throw AppErrors.badRequest('Input order schema is invalid');
            }

            if (schema[schema.length-1].order > Math.max(...targets.map(i => i.order))) {
                throw AppErrors.badRequest('Input order schema is invalid: too big order number');
            }
        }

        const swapImages = (a: Image, b: Image) => {
            const tmp = a.order;
            a.order = b.order;
            b.order = tmp;
        }

        // TODO: was too drunk to do it optimized
        const ignore: string[] = []
        for (const schemaItem of schema) {
            if (ignore.includes(schemaItem.id)) {
                continue
            }

            const image = targets.find(i => i.id === schemaItem.id);
            if (!image) {
                throw AppErrors.dbEntityNotFound(`Image ${schemaItem.id} not found`)
            }

            const pair = targets.find(i => i.order === schemaItem.order);
            if (pair) {
                ignore.push(pair.id)
                swapImages(pair, image);
            } else {
                throw AppErrors.badRequest('Input order schema is invalid: not enough target images');
            }
        }

        await this.em.persistAndFlush(targets);
    }

    async remove(id: string) {
        const image = await this.em.findOne(Image, { id });
        if (!image) {
            throw AppErrors.dbEntityNotFound(`Image ${id} not found`)
        }
        await this.em.removeAndFlush(image);
    }

    // TODO create transaction
    async unattachImage(imageId: string) {
        const image = await this.em.findOne(Image, { id: imageId });

        if (!image) {
            throw AppErrors.dbEntityNotFound(`Image ${imageId} not found`)
        }
        if (!image.ownerType || !image.ownerId) {
            throw AppErrors.badRequest(`Image ${imageId} not attached`)
        }

        image.ownerId = undefined;
        image.ownerType = undefined;

        const attachedImages = await this.findAttachedImages(image.ownerType!, image.ownerId!);
        for (let i = 0; i < attachedImages.length; i++) {
            attachedImages[i].order = i;
            await this.em.persistAndFlush(attachedImages[i]);
        }

        await this.em.persistAndFlush(image);
    }

    async attachImage(imageId: string, dto: AttachImageDto) {
        const image = await this.em.findOne(Image, { id: imageId });
        if (!image) {
            throw AppErrors.dbEntityNotFound(`Image ${imageId} not found`)
        }
        image.ownerId = String(dto.ownerId);
        image.ownerType = dto.ownerType as ImageTypeEnum;

        image.order = await this.countAttached(image.ownerId, image.ownerType);
        await this.em.persistAndFlush(image);

        return image
    }

    async countAttached(ownerId: string, ownerType: ImageTypeEnum) {
        return await this.em.count(Image, { ownerId, ownerType });
    }

    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        return await this.em.find(Image,
            { ownerType, ownerId },
            { orderBy: { order: 'ASC' }
            }
        );
    }

    async findBlank(blankType: ImageTypeEnum) {
        return await this.em.findOneOrFail(Image, { blankType });
    }

    @CreateRequestContext()
    async createBlank(file: Express.Multer.File, blankType: ImageTypeEnum): Promise<void> {
        const existing = await this.em.findOne(Image, { blankType });
        if (existing) {
            throw AppErrors.conflict('Blank image already exists');
        }

        const imageObj = await this.imgProcessor.processProductImage(file);
        const image = new Image();
        image.image = imageObj;
        image.blankType = blankType;
        await this.em.persistAndFlush(image);
    }

    async updateBlank(file: Express.Multer.File, blankType: ImageTypeEnum): Promise<void> {
        const image = await this.em.findOneOrFail(Image, { blankType });
        const imageObj = await this.imgProcessor.processProductImage(file);
        image.image = imageObj;
        await this.em.persistAndFlush(image);
    }
}
