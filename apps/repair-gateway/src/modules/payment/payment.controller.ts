import { Body, Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { UserClientService } from '@asko/gateway-common';
import {
    CreatePaymentDto,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    PaymentTargetType,
} from '@asko/shared';
import { RequiredRoles, JwtAuthUser } from '@asko/gateway-common';
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
        private readonly userClient: UserClientService,
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
    ) {}

    private async enrichPayments(payments: any[]): Promise<void> {
        await Promise.all(payments.map(async (p) => {
            if (!p.userId) return;
            try {
                const u = await this.userClient.findUserById({ id: p.userId });
                if (u) p.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone };
            } catch { /* non-critical */ }
        }));
    }

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

    @ApiOkResponse({ description: 'Cash payment confirmed' })
    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER, Role.REPAIRER)
    @Post('confirm-cash')
    async confirmCashPayment(
        @JwtAuthUser() user: JwtPayload,
        @Body() body: { paymentId: string; confirmCode: string; amount: number },
    ) {
        if (!body.confirmCode || typeof body.confirmCode !== 'string') {
            throw new ForbiddenException('Confirmation code is required');
        }
        if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
            throw new ForbiddenException('Amount verification is required');
        }

        const isStaff = user.roles.some((r) =>
            r === Role.SUPER_ADMIN || r === Role.ADMIN || r === Role.MANAGER,
        );

        if (!isStaff) {
            // Repairer: verify they are assigned to the repair
            const { payment } = await this.paymentService.getPaymentById(body.paymentId);
            if (payment.targetType !== PaymentTargetType.REPAIR_REQUEST) {
                throw new ForbiddenException('Repairers can only confirm repair request cash payments');
            }
            const { request } = await this.repairClient.findById(payment.targetId);
            const { repairer } = await this.repairerClient.findByUserId(user.sub);
            if (!repairer || request.repairerId !== repairer.id) {
                throw new ForbiddenException('You are not assigned to this repair');
            }
        }

        return this.paymentService.confirmCashPayment(body.paymentId, user.sub, body.confirmCode, body.amount);
    }

    @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @Get('list')
    async listPayments(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('provider') provider?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
    ) {
        const result = await this.paymentService.listPayments(
            { status, provider },
            { page, limit, search, sortBy, sortOrder },
        );
        result.data = result.data ?? [];
        await this.enrichPayments(result.data);
        return result;
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
    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @Get('stats')
    async getStats() {
        return this.paymentService.getPaymentStats();
    }
}
