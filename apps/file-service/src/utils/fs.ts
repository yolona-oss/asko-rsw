import { promises as fs } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

export async function loadFileFromPath(filePath: string): Promise<Express.Multer.File> {
    const buffer = await fs.readFile(filePath);

    return {
        fieldname: 'file',
        originalname: path.basename(filePath),
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: buffer.length,
        buffer,
        stream: Readable.from(buffer),
        destination: path.dirname(filePath),
        filename: path.basename(filePath),
        path: filePath,
    };
}
