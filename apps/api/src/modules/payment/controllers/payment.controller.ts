import { Body, Controller, Get, Param, Post, Query, Headers } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, ALL_ROLES, STAFF_ROLES, JwtPayload } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @RequiredRoles(...ALL_ROLES)
    @Get('options')
    async getOptions() {
        return this.paymentService.getOptions();
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('create')
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(user.sub, dto);
    }

    /** List all payments (manager/admin/dealer) */
    @RequiredRoles(...STAFF_ROLES)
    @Get('list')
    async list(
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('provider') provider?: string,
        @Query('search') search?: string,
    ) {
        return this.paymentService.listPayments({
            offset: offset ? parseInt(offset) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
            provider,
            search,
        });
    }

    /** List payments for current user */
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async myPayments(
        @JwtAuthUser() user: JwtPayload,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.paymentService.listUserPayments(user.sub, {
            offset: offset ? parseInt(offset) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
        });
    }

    /** Get payment statistics */
    @RequiredRoles(...STAFF_ROLES)
    @Get('stats')
    async stats() {
        return this.paymentService.getPaymentStats();
    }

    /** Get payment statistics for current user */
    @RequiredRoles(...ALL_ROLES)
    @Get('my/stats')
    async myStats(@JwtAuthUser() user: JwtPayload) {
        return this.paymentService.getPaymentStats(user.sub);
    }

    @Public()
    @Post('webhook/:provider')
    async webhook(
        @Param('provider') provider: string,
        @Body() body: any,
        @Headers() headers: Record<string, string>,
    ) {
        return this.paymentService.handleWebhook(provider, body, headers);
    }
}
