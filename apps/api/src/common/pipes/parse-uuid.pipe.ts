// import { PipeTransform, Injectable } from '@nestjs/common';
// import { AppError, AppErrorTypeEnum } from './../app-error';
//
// @Injectable()
// export class ParseObjectIdPipe implements PipeTransform<any, string> {
//     transform(value: any): string {
//         const validObjectId = Types.ObjectId.isValid(value);
//
//         if (!validObjectId) {
//             throw new AppError(AppErrorTypeEnum.INVALID_OBJECT_ID)
//         }
//
//         //return Types.ObjectId.createFromHexString(value);
//         return value
//     }
// }

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
