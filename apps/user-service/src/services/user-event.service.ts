import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Role } from '@asko/shared';

@Injectable()
export class UserEventService implements OnModuleInit {
    constructor(
        @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.client.connect();
        } catch (e) {
            console.error('[UserEventService] RabbitMQ connection failed:', e);
        }
    }

    emitUserCreated(userId: string, roles: Role[]): void {
        this.client.emit('user.created', { userId, roles });
    }

    emitUserDeleted(userId: string): void {
        this.client.emit('user.deleted', { userId });
    }

    emitRoleAdded(userId: string, role: Role): void {
        this.client.emit('user.role_added', { userId, role });
    }

    emitRoleRemoved(userId: string, role: Role): void {
        this.client.emit('user.role_removed', { userId, role });
    }

    emitStatusChanged(userId: string, isActive: boolean, changedBy?: string): void {
        this.client.emit('user.status_changed', { userId, isActive, changedBy: changedBy ?? null, timestamp: new Date().toISOString() });
    }
}
