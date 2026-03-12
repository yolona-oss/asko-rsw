import { promises as fs } from 'fs';
import * as path from 'path';
import { Readable } from 'stream'

// NOTE: maybe add URL path usage capability
export function extractFileName(filePath: string, removeExtension: boolean = true) {
    const urlArr = filePath.split('/')
    const fullName = urlArr[urlArr.length - 1]
    let fileName = fullName
    if (removeExtension) {
        fileName = fullName.split('.')[0]
    }
    return fileName
}

export function normalizeName(title: string): string {
    return title
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s\s+/g, ' ')
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
}

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
