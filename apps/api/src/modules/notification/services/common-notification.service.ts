import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './../gateways/notify.gateway';

@Injectable()
export class NotificationService {
    constructor(private readonly gateway: NotificationGateway) { }

    async notifyUser(userId: string, payload: any) {
        this.gateway.emitToUser(userId, payload);
    }

    async notifyRepairUpdate(userId: string, payload: any) {
        this.gateway.emitRepairUpdate(userId, payload);
    }

    async notifyRepairCompleted(userId: string, payload: any) {
        this.gateway.emitRepairCompleted(userId, payload);
    }

    async notifyManagers(payload: any) {
        this.gateway.emitToManagers(payload);
    }

    async notifyRepairers(payload: any) {
        this.gateway.emitToRepairers(payload);
    }
}
