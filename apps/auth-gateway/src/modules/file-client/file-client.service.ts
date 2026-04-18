// Auth gateway no longer needs a custom FileClientService subclass.
// All uploads go through the unified FileClientService.uploadFile() in @asko/gateway-common.
// This file is kept as a re-export for module registration compatibility.
export { FileClientService as AuthFileClientService } from '@asko/gateway-common';
