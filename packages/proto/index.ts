export * from './interfaces/user.interface';

import { join } from 'path';

export const USER_PROTO_PATH = join(__dirname, 'user.proto');
export const USER_PACKAGE_NAME = 'user';
export const USER_SERVICE_NAME = 'UserService';
