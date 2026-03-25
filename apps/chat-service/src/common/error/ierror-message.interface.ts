import { HttpStatus } from '@nestjs/common';

export interface IErrorMessage {
    httpStatus: HttpStatus;
    message: string;
}
