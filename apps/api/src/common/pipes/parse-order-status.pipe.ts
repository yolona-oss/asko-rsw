// import { PipeTransform, Injectable } from '@nestjs/common';
// import { OrderStatus } from '@asko/shared'; 
// import { AppErrors } from 'common/error'
//
// @Injectable()
// export class ParseOrderStatusPipe implements PipeTransform<any, OrderStatus> {
//     // its look strange...
//     //
//     transform(value: any): OrderStatus {
//         if (value in OrderStatus) {
//             return value
//         }
//         throw AppErrors.invalidOrderStatus('Invalid order status: ' + value)
//     }
// }
//
