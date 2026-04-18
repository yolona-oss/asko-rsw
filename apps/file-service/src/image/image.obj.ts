import { Property } from '@mikro-orm/core';
import { IImageEntry, IImageObj } from '@asko/shared';

export class CloudinaryImage implements IImageEntry {
    @Property()
    public_id: string;

    @Property()
    version: number;

    @Property()
    signature: string;

    @Property()
    width: number;

    @Property()
    height: number;

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
}

export class ImageObj implements IImageObj {
  @Property({ type: 'json' })
  original: CloudinaryImage;

  @Property({ type: 'json', nullable: true })
  thumbnail?: CloudinaryImage;

  @Property({ type: 'json', nullable: true })
  medium?: CloudinaryImage;

  @Property({ type: 'json', nullable: true })
  large?: CloudinaryImage;
}
