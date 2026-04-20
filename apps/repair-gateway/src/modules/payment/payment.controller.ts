import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { UserClientService, buildRequesterContext } from '@asko/gateway-common';
import {
    CreatePaymentDto,
    JwtPayload,
    PaymentTargetType,
    msg,
} from '@asko/shared';
import { AppErrors } from 'common/error';
import { Permissions, Permission, isStaff as checkIsStaff } from '@asko/authorization';
import { JwtAuthUser } from '@asko/gateway-common';
import {
    PaymentOptionsResponseDto,
    ProcessInvoiceResponseDto,
    PaginatedPaymentsResponseDto,
    PaymentStatsResponseDto,
} from './dto/payment.response.dto';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentClientService,
        private readonly userClient: UserClientService,
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
    ) {}

    private async enrichPayments(payments: any[], requester?: JwtPayload): Promise<void> {
        const ctx = buildRequesterContext(requester);
        await Promise.all(payments.map(async (p) => {
            if (!p.userId) return;
            try {
                const u = await this.userClient.getUserProfile({ id: p.userId, requester: ctx });
                if (u) p.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone };
            } catch { /* non-critical */ }
        }));
    }

    @ApiOkResponse({ type: PaymentOptionsResponseDto })
    @Get('options')
    async getOptions() {
        return this.paymentService.getOptions();
    }

    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @Post('create')
    async createPayment(@JwtAuthUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(user.sub, dto);
    }

    @ApiOkResponse({ description: 'Cash payment confirmed' })
    @Permissions(Permission.PAYMENT_CONFIRM_CASH)
    @Post('confirm-cash')
    async confirmCashPayment(
        @JwtAuthUser() user: JwtPayload,
        @Body() body: { paymentId: string; confirmCode: string; amount: number },
    ) {
        if (!body.confirmCode || typeof body.confirmCode !== 'string') {
            throw AppErrors.badRequest({ key: msg.payment.confirmCodeRequired });
        }
        if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
            throw AppErrors.badRequest({ key: msg.payment.amountVerificationRequired });
        }

        if (!checkIsStaff(user)) {
            // Repairer: verify they are assigned to the repair
            const { payment } = await this.paymentService.getPaymentById(body.paymentId);
            if (payment.targetType !== PaymentTargetType.REPAIR_REQUEST) {
                throw AppErrors.forbidden({ key: msg.payment.repairerOnlyRepairCash });
            }
            const { request } = await this.repairClient.findById(payment.targetId);
            const { repairer } = await this.repairerClient.findByUserId(user.sub);
            if (!repairer || request.repairerId !== repairer.id) {
                throw AppErrors.forbidden({ key: msg.payment.notAssignedToRepair });
            }
        }

        return this.paymentService.confirmCashPayment(body.paymentId, user.sub, body.confirmCode, body.amount);
    }

    @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
    @Permissions(Permission.PAYMENT_VIEW_ALL)
    @Get('list')
    async listPayments(
        @JwtAuthUser() user: JwtPayload,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('provider') provider?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        const result = await this.paymentService.listPayments(
            { status, provider, dateFrom, dateTo },
            { page, limit, search, sortBy, sortOrder },
        );
        result.data = result.data ?? [];
        await this.enrichPayments(result.data, user);
        return result;
    }

    @ApiOkResponse({ type: PaymentStatsResponseDto })
    @Get('my/stats')
    async getMyStats(
        @JwtAuthUser() user: JwtPayload,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        return this.paymentService.getPaymentStats(user.sub, dateFrom, dateTo);
    }

    @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
    @Get('my')
    async getMyPayments(
        @JwtAuthUser() user: JwtPayload,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
    ) {
        return this.paymentService.listUserPayments(
            user.sub,
            { status },
            { page, limit, sortBy, sortOrder },
        );
    }

    @ApiOkResponse({ type: PaymentStatsResponseDto })
    @Permissions(Permission.PAYMENT_VIEW_ALL)
    @Get('stats')
    async getStats(
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        return this.paymentService.getPaymentStats(undefined, dateFrom, dateTo);
    }
}
