export * from './interfaces/user.interface';
export * from './interfaces/payment.interface';
export * from './interfaces/file.interface';
export * from './interfaces/repair.interface';
export * from './interfaces/notification.interface';
export * from './interfaces/chat.interface';
export * from './interfaces/content.interface';

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

export const REPAIR_PROTO_PATH = join(__dirname, 'repair.proto');
export const REPAIR_PACKAGE_NAME = 'repair';
export const REPAIR_SERVICE_NAME = 'RepairService';
export const DEVICE_SERVICE_NAME = 'DeviceService';
export const REPAIRER_SERVICE_NAME = 'RepairerService';
export const CERTIFICATE_SERVICE_NAME = 'CertificateService';
export const DEALER_SERVICE_NAME = 'DealerService';
export const SCHEDULE_SERVICE_NAME = 'ScheduleService';

export const NOTIFICATION_PROTO_PATH = join(__dirname, 'notification.proto');
export const NOTIFICATION_PACKAGE_NAME = 'notification';
export const NOTIFICATION_SERVICE_NAME = 'NotificationService';

export const CHAT_PROTO_PATH = join(__dirname, 'chat.proto');
export const CHAT_PACKAGE_NAME = 'chat';
export const CHAT_SERVICE_NAME = 'ChatService';

export const CONTENT_PROTO_PATH = join(__dirname, 'content.proto');
export const CONTENT_PACKAGE_NAME = 'content';
export const CONTENT_SERVICE_NAME = 'ContentService';
