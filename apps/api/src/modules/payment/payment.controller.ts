import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import {
    CreatePaymentDto,
    ALL_ROLES,
    ADMIN_ROLES,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import {
    PaymentOptionsResponseDto,
    ProcessInvoiceResponseDto,
    PaginatedPaymentsResponseDto,
    PaymentStatsResponseDto,
} from 'common/dto/responses';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentClientService,
    ) {}

    @ApiOkResponse({ type: PaymentOptionsResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('options')
    async getOptions() {
        return this.paymentService.getOptions();
    }

    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post('create')
    async createPayment(@JwtAuthUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(user.sub, dto);
    }

    @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Get('list')
    async listPayments(
        @Query('offset') offset?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('provider') provider?: string,
        @Query('search') search?: string,
    ) {
        return this.paymentService.listPayments(
            { status, provider },
            { offset, limit, search },
        );
    }

    @ApiOkResponse({ type: PaymentStatsResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my/stats')
    async getMyStats(@JwtAuthUser() user: JwtPayload) {
        return this.paymentService.getPaymentStats(user.sub);
    }

    @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async getMyPayments(
        @JwtAuthUser() user: JwtPayload,
        @Query('offset') offset?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
    ) {
        return this.paymentService.listUserPayments(
            user.sub,
            { status },
            { offset, limit },
        );
    }

    @ApiOkResponse({ type: PaymentStatsResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Get('stats')
    async getStats() {
        return this.paymentService.getPaymentStats();
    }
}
