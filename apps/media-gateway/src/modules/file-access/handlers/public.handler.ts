import { Injectable } from '@nestjs/common';
import { FileVisibility } from '@asko/shared';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class PublicVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.PUBLIC;
    async authorize(): Promise<void> { /* always allowed */ }
}
