// Content gateway no longer needs a custom FileClientService subclass.
// All uploads go through the unified FileClientService.uploadFile() in @asko/gateway-common.
export { FileClientService as ContentFileClientService } from '@asko/gateway-common';
