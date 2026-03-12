import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './../gateways/notify.gateway';

/**
 * Simple NotificationService that emits realtime notifications and can be extended to persist notifications.
 */
@Injectable()
export class NotificationService {
    constructor(private readonly gateway: NotificationGateway) {}

    async notifyUser(userId: string, payload: any) {
        // persist to DB (optional) + emit
        this.gateway.emitToUser(userId, payload);
    }

    async notifyManagers(restaurantId: string, payload: any) {
        this.gateway.emitToManagers(restaurantId, payload);
    }

    async notifyKitchen(restaurantId: string, payload: any) {
        this.gateway.emitToKitchen(restaurantId, payload);
    }
}
