import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentService } from 'services/payment.service';
import { CreatePaymentDto } from '@asko/shared';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Get('options')
    async getOptions() {
        return this.paymentService.getOptions();
    }

    @Post('create')
    async create(@Body() body: CreatePaymentDto & { userId: string }) {
        return this.paymentService.createPayment(body.userId, body);
    }

    /** List all payments (manager/admin) */
    @Get('list')
    async list(
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('provider') provider?: string,
        @Query('search') search?: string,
    ) {
        return this.paymentService.listPayments({
            status,
            provider,
        }, {
            offset: offset ? parseInt(offset) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            search,
        });
    }

    /** List payments for a specific user */
    @Get('my')
    async myPayments(
        @Query('userId') userId: string,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.paymentService.listUserPayments(userId, {
            status,
        }, {
            offset: offset ? parseInt(offset) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    /** Get payment statistics */
    @Get('stats')
    async stats() {
        return this.paymentService.getPaymentStats();
    }

    /** Get payment statistics for a specific user */
    @Get('my/stats')
    async myStats(@Query('userId') userId: string) {
        return this.paymentService.getPaymentStats(userId);
    }
}
