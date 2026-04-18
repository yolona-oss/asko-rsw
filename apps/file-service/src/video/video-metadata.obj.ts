import { Property } from '@mikro-orm/core';
import { IVideoMetadata } from '@asko/shared';

export class VideoMetadata implements IVideoMetadata {
    @Property()
    public_id: string;

    @Property()
    format: string;

    @Property()
    resource_type: string;

    @Property()
    url: string;

    @Property()
    secure_url: string;

    @Property()
    original_filename: string;

    @Property({ nullable: true })
    duration?: number;

    @Property({ nullable: true })
    size?: number;
}
