import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParseAddressPipe implements PipeTransform<any, string> {
    transform(value: any): string {
        return String(value)
    }
}

