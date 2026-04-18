import { Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';
import { v4 as uuid } from 'uuid';
import { AppConfig } from 'app.config';
import { extFromMime } from 'upload/mime-utils';
import {
    StorageProvider,
    ResourceType,
    StorageUploadMeta,
    StorageUploadResult,
} from 'storage/storage-provider.interface';

@Injectable()
export class S3StorageService implements StorageProvider {
    private readonly s3: S3Client;
    private readonly bucket: string;
    private readonly prefix: string;
    private readonly cdnUrl?: string;
    private readonly region: string;

    constructor(config: AppConfig) {
        const s3Config = config.s3;
        this.bucket = s3Config.bucket;
        this.prefix = s3Config.prefix;
        this.cdnUrl = s3Config.cdnUrl;
        this.region = s3Config.region;

        this.s3 = new S3Client({
            region: s3Config.region,
            endpoint: s3Config.endpoint || undefined,
            forcePathStyle: s3Config.forcePathStyle,
            credentials: {
                accessKeyId: s3Config.accessKeyId,
                secretAccessKey: s3Config.secretAccessKey,
            },
        });
    }

    private buildKey(resourceType: ResourceType, folder: string, filename: string): string {
        const mediaDir = resourceType === 'raw' ? 'documents' : resourceType === 'video' ? 'videos' : 'images';
        const parts = [this.prefix, mediaDir, folder, filename].filter(Boolean);
        return parts.join('/');
    }

    private buildUrl(key: string): string {
        if (this.cdnUrl) {
            return `${this.cdnUrl.replace(/\/$/, '')}/${key}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    async upload(
        stream: NodeJS.ReadableStream,
        meta: StorageUploadMeta,
        resourceType: ResourceType,
        folder: string,
    ): Promise<StorageUploadResult> {
        const ext = extFromMime(meta.mimetype, meta.originalname);
        const filename = `${uuid()}.${ext}`;
        const key = this.buildKey(resourceType, folder, filename);

        let bytes = 0;
        const counter = new PassThrough();
        counter.on('data', (chunk: Buffer) => { bytes += chunk.length; });
        stream.pipe(counter);

        const upload = new Upload({
            client: this.s3,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: counter,
                ContentType: meta.mimetype,
            },
        });

        await upload.done();

        const url = this.buildUrl(key);
        return {
            publicId: key,
            url,
            secureUrl: url,
            originalFilename: meta.originalname,
            format: ext,
            resourceType,
            width: 0,
            height: 0,
            version: 1,
            signature: '',
            size: bytes,
        };
    }

    async delete(publicId: string): Promise<void> {
        await this.s3.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: publicId,
        }));
    }

    async deleteBatch(publicIds: string[]): Promise<void> {
        if (publicIds.length === 0) return;

        for (let i = 0; i < publicIds.length; i += 1000) {
            const batch = publicIds.slice(i, i + 1000);
            await this.s3.send(new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: { Objects: batch.map(Key => ({ Key })) },
            }));
        }
    }

    generateSizedUrl(url: string): string {
        return url;
    }

    async put(key: string, data: Buffer, contentType: string): Promise<string> {
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: data,
            ContentType: contentType,
        }));
        return this.buildUrl(key);
    }

    async download(publicId: string): Promise<NodeJS.ReadableStream> {
        const result = await this.s3.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: publicId,
        }));
        return result.Body as NodeJS.ReadableStream;
    }
}
