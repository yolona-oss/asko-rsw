export * from './interfaces/user.interface';
export * from './interfaces/payment.interface';

import { join } from 'path';

export const USER_PROTO_PATH = join(__dirname, 'user.proto');
export const USER_PACKAGE_NAME = 'user';
export const USER_SERVICE_NAME = 'UserService';

export const PAYMENT_PROTO_PATH = join(__dirname, 'payment.proto');
export const PAYMENT_PACKAGE_NAME = 'payment';
export const PAYMENT_SERVICE_NAME = 'PaymentService';
