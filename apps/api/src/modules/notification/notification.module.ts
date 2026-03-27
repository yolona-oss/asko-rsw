import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationGateway } from "./gateways/notify.gateway";
import { NotificationClientModule } from "modules/notification-client/notification-client.module";
import { NotificationController } from "./controllers/notification.controller";
import { redisProvider } from "providers/redis.provider";

@Module({
    imports: [NotificationClientModule, JwtModule],
    controllers: [NotificationController],
    providers: [NotificationGateway, redisProvider],
    exports: [],
})
export class NotificationModule { }
