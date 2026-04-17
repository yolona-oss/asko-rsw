import { Module } from '@nestjs/common';
import { FileAccessController } from './file-access.controller';
import { FileAccessService } from './file-access.service';
import { ChatClientModule } from 'modules/chat-client/chat-client.module';
import { FILE_VISIBILITY_HANDLERS } from './handlers/visibility-handler.interface';
import { PublicVisibilityHandler } from './handlers/public.handler';
import { PrivateVisibilityHandler } from './handlers/private.handler';
import { RoleRestrictedVisibilityHandler } from './handlers/role-restricted.handler';
import { ParticipantsOnlyVisibilityHandler } from './handlers/participants-only.handler';

const HANDLERS = [
    PublicVisibilityHandler,
    PrivateVisibilityHandler,
    RoleRestrictedVisibilityHandler,
    ParticipantsOnlyVisibilityHandler,
];

@Module({
    imports: [ChatClientModule],
    controllers: [FileAccessController],
    providers: [
        FileAccessService,
        ...HANDLERS,
        {
            provide: FILE_VISIBILITY_HANDLERS,
            useFactory: (...handlers: any[]) => handlers,
            inject: HANDLERS,
        },
    ],
})
export class FileAccessModule {}
