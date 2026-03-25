import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Image } from 'entities/image.entity';
import { ImageResizeService } from 'services/image-resize.service';

export interface ImageResizeEvent {
    imageId: string;
    originalPublicId: string;
}

@Controller()
export class ImageResizeConsumer {
    constructor(
        private readonly em: EntityManager,
        private readonly resizeService: ImageResizeService,
    ) {}

    @EventPattern('image.resize')
    @CreateRequestContext()
    async handleResize(@Payload() data: ImageResizeEvent, @Ctx() ctx: RmqContext) {
        const channel = ctx.getChannelRef();
        const msg = ctx.getMessage();

        try {
            const sizes = await this.resizeService.generateSizes(data.originalPublicId);

            const image = await this.em.findOne(Image, { id: data.imageId });
            if (image) {
                image.image.thumbnail = sizes.thumbnail;
                image.image.medium = sizes.medium;
                image.image.large = sizes.large;
                await this.em.flush();
            }

            channel.ack(msg);
            console.log(`[ImageResize] Resized image ${data.imageId}`);
        } catch (err) {
            console.error(`[ImageResize] Failed to resize image ${data.imageId}:`, err);
            channel.ack(msg);
        }
    }
}
