import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DealerClientService } from 'modules/dealer-client/dealer-client.service';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import {
    CreateDealerProfileDto,
    UpdateDealerProfileDto,
    AddDealerClientDto,
    RequestPointsWithdrawalDto,
    ProcessWithdrawalDto,
    PaginationDto,
    PaymentTargetType,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    WithdrawalStatus,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('dealers')
export class DealerController {
    constructor(
        private readonly dealerClient: DealerClientService,
        private readonly paymentService: PaymentClientService,
    ) {}

    // ── Admin ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async createProfile(@Body() dto: CreateDealerProfileDto) {
        return this.dealerClient.createProfile(dto.userId, {
            companyName: dto.companyName,
            inn: dto.inn,
        });
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.dealerClient.findAllDealers(pagination);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('withdrawals/all')
    async getAllWithdrawals(@Query() pagination: PaginationDto) {
        return this.dealerClient.getAllWithdrawals(pagination);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/process')
    async processWithdrawal(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ProcessWithdrawalDto,
    ) {
        return this.dealerClient.processWithdrawal(id, user.sub, dto.status);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.APPROVED);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.REJECTED);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/mark-paid')
    async markPaid(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const withdrawal = await this.dealerClient.getWithdrawalForPayout(id);
        return this.paymentService.processPayout(user.sub, {
            targetType: PaymentTargetType.DEALER_WITHDRAWAL,
            targetId: id,
            amount: withdrawal.amount,
            recipientUserId: withdrawal.dealerUserId,
        });
    }

    // ── Dealer ──

    @RequiredRoles(Role.DEALER)
    @Get('profile')
    async getProfile(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getProfile(user.sub);
    }

    @RequiredRoles(Role.DEALER)
    @Patch('profile')
    async updateProfile(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateDealerProfileDto) {
        return this.dealerClient.updateProfile(user.sub, dto);
    }

    @RequiredRoles(Role.DEALER)
    @Get('clients')
    async getClients(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getClients(user.sub);
    }

    @RequiredRoles(Role.DEALER)
    @Get('user-devices/:userId')
    async getUserDevices(@Param('userId') userId: string) {
        return this.dealerClient.getUserDevicesForCertificate(userId);
    }

    @RequiredRoles(Role.DEALER)
    @Post('clients')
    async addClient(@JwtAuthUser() user: JwtPayload, @Body() dto: AddDealerClientDto) {
        return this.dealerClient.addClient(user.sub, dto.clientUserId);
    }

    @RequiredRoles(Role.DEALER)
    @Get('points')
    async getPointsHistory(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.dealerClient.getPointsHistory(user.sub, pagination);
    }

    @RequiredRoles(Role.DEALER)
    @Post('withdraw')
    async requestWithdrawal(@JwtAuthUser() user: JwtPayload, @Body() dto: RequestPointsWithdrawalDto) {
        return this.dealerClient.requestWithdrawal(user.sub, dto.amount);
    }

    @RequiredRoles(Role.DEALER)
    @Get('withdrawals')
    async getWithdrawals(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getWithdrawals(user.sub);
    }
}
