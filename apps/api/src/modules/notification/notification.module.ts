import { Module } from "@nestjs/common";
import { NotificationGateway } from "./gateways/notify.gateway";
import { NotificationService } from "./services/common-notification.service";

@Module({
    providers: [NotificationService, NotificationGateway],
    exports: [NotificationService],
})
export class NotificationModule {}
