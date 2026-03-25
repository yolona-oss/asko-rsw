import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum PaymentCommandType {
    CREATE_INVOICE = 'repair.create_invoice',
    REFUND_TARGET = 'repair.refund_target',
}

export interface CreateInvoiceCommand {
    type: PaymentCommandType.CREATE_INVOICE;
    userId: string;
    targetType: string;
    targetId: string;
    amount: number;
    currency?: string;
    timestamp: Date;
}

export interface RefundTargetCommand {
    type: PaymentCommandType.REFUND_TARGET;
    targetType: string;
    targetId: string;
    timestamp: Date;
}

@Injectable()
export class PaymentCommandService implements OnModuleInit {
    constructor(
        @Inject('PAYMENT_COMMANDS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        await this.rmqClient.connect();
    }

    async emitCreateInvoice(
        userId: string,
        targetType: string,
        targetId: string,
        amount: number,
        currency?: string,
    ): Promise<void> {
        const command: CreateInvoiceCommand = {
            type: PaymentCommandType.CREATE_INVOICE,
            userId,
            targetType,
            targetId,
            amount,
            currency,
            timestamp: new Date(),
        };
        console.log(`[PaymentCommand] ${command.type}`, JSON.stringify(command));
        this.rmqClient.emit(command.type, command);
    }

    async emitRefundTarget(targetType: string, targetId: string): Promise<void> {
        const command: RefundTargetCommand = {
            type: PaymentCommandType.REFUND_TARGET,
            targetType,
            targetId,
            timestamp: new Date(),
        };
        console.log(`[PaymentCommand] ${command.type}`, JSON.stringify(command));
        this.rmqClient.emit(command.type, command);
    }
}
