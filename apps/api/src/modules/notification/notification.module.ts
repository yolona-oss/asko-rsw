import { Module } from "@nestjs/common";
import { NotificationGateway } from "./gateways/notify.gateway";
import { NotificationService } from "./services/common-notification.service";
import { NotificationClientModule } from "modules/notification-client/notification-client.module";
import { NotificationController } from "./controllers/notification.controller";

@Module({
    imports: [NotificationClientModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationGateway],
    exports: [NotificationService],
})
export class NotificationModule {}
