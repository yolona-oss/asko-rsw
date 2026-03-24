export * from './interfaces/user.interface';
export * from './interfaces/payment.interface';
export * from './interfaces/file.interface';
export * from './interfaces/device.interface';
export * from './interfaces/repairer.interface';
export * from './interfaces/certificate.interface';
export * from './interfaces/repair.interface';
export * from './interfaces/dealer.interface';

import { join } from 'path';

export const USER_PROTO_PATH = join(__dirname, 'user.proto');
export const USER_PACKAGE_NAME = 'user';
export const USER_SERVICE_NAME = 'UserService';

export const PAYMENT_PROTO_PATH = join(__dirname, 'payment.proto');
export const PAYMENT_PACKAGE_NAME = 'payment';
export const PAYMENT_SERVICE_NAME = 'PaymentService';

export const FILE_PROTO_PATH = join(__dirname, 'file.proto');
export const FILE_PACKAGE_NAME = 'file';
export const FILE_SERVICE_NAME = 'FileService';

export const DEVICE_PROTO_PATH = join(__dirname, 'device.proto');
export const DEVICE_PACKAGE_NAME = 'device';
export const DEVICE_SERVICE_NAME = 'DeviceService';

export const REPAIRER_PROTO_PATH = join(__dirname, 'repairer.proto');
export const REPAIRER_PACKAGE_NAME = 'repairer';
export const REPAIRER_SERVICE_NAME = 'RepairerService';

export const CERTIFICATE_PROTO_PATH = join(__dirname, 'certificate.proto');
export const CERTIFICATE_PACKAGE_NAME = 'certificate';
export const CERTIFICATE_SERVICE_NAME = 'CertificateService';

export const REPAIR_PROTO_PATH = join(__dirname, 'repair.proto');
export const REPAIR_PACKAGE_NAME = 'repair';
export const REPAIR_SERVICE_NAME = 'RepairService';

export const DEALER_PROTO_PATH = join(__dirname, 'dealer.proto');
export const DEALER_PACKAGE_NAME = 'dealer';
export const DEALER_SERVICE_NAME = 'DealerService';
