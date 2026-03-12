import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParsePaymentIdPipe implements PipeTransform<any, string> {
    transform(value: any): string {
        return String(value)
    }
}

