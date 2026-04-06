import { ArgumentMetadata, BadRequestException, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class UUIDValiationPipe implements PipeTransform {
    constructor(@Optional() private readonly version?: '3' | '4' | '5') {}

    transform(value: string, _: ArgumentMetadata) {
        if (!isUUID(value, this.version)) {
            throw new BadRequestException(`Invalid UUID: ${value}`);
        }
        return value;
    }
}
