import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DealerClientService } from 'modules/repair-client/dealer-client.service';
import { UserClientService } from '@asko/gateway-common';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import {
    CreateDealerProfileDto,
    UpdateDealerProfileDto,
    AddDealerClientDto,
    RequestPointsWithdrawalDto,
    ProcessWithdrawalDto,
    PaginationDto,
    PaymentTargetType,
    PaymentProviderType,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    WithdrawalStatus,
} from '@asko/shared';
import { RequiredRoles, JwtAuthUser } from '@asko/gateway-common';
import { UserResponseDto } from 'common/dto/responses/user.response.dto';
import {
    DealerProfileResponseDto,
    PaginatedDealersResponseDto,
    PaginatedWithdrawalsResponseDto,
    WithdrawalResponseDto,
    DealerClientListResponseDto,
    DealerUserDeviceListResponseDto,
    DealerClientResponseDto,
    PaginatedPointsResponseDto,
    WithdrawalListResponseDto,
} from '../dto/dealer.response.dto';
import { PayoutResponseDto } from 'modules/payment/dto/payment.response.dto';

@ApiTags('Dealers')
@Controller('dealers')
export class DealerController {
    constructor(
        private readonly dealerClient: DealerClientService,
        private readonly userClient: UserClientService,
        private readonly paymentService: PaymentClientService,
    ) {}

    // ── Admin ──

    @ApiCreatedResponse({ type: DealerProfileResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async createProfile(@Body() dto: CreateDealerProfileDto) {
        return this.dealerClient.createProfile(dto.userId, {
            companyName: dto.companyName,
            inn: dto.inn,
        });
    }

    @ApiOkResponse({ type: PaginatedDealersResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.dealerClient.findAllDealers(pagination);
    }

    @ApiOkResponse({ type: PaginatedWithdrawalsResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Get('withdrawals/all')
    async getAllWithdrawals(@Query() pagination: PaginationDto) {
        return this.dealerClient.getAllWithdrawals(pagination);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/process')
    async processWithdrawal(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ProcessWithdrawalDto,
    ) {
        return this.dealerClient.processWithdrawal(id, user.sub, dto.status);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.APPROVED);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.REJECTED);
    }

    @ApiCreatedResponse({ type: PayoutResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/mark-paid')
    async markPaid(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const withdrawal = await this.dealerClient.getWithdrawalForPayout(id);
        return this.paymentService.processPayout(user.sub, {
            targetType: PaymentTargetType.DEALER_WITHDRAWAL,
            targetId: id,
            amount: withdrawal.amount,
            recipientUserId: withdrawal.dealerUserId,
            provider: PaymentProviderType.CARD,
            metadata: {
                cardNumber: withdrawal.cardNumber,
                cardHolderName: withdrawal.cardHolderName,
            },
        });
    }

    // ── Dealer ──

    @ApiOkResponse({ type: UserResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('search-user')
    async searchUser(@Query('email') email: string) {
        return this.userClient.findUserByEmail(email);
    }

    @ApiOkResponse({ type: DealerProfileResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('profile')
    async getProfile(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getProfile(user.sub);
    }

    @ApiOkResponse({ type: DealerProfileResponseDto })
    @RequiredRoles(Role.DEALER)
    @Patch('profile')
    async updateProfile(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateDealerProfileDto) {
        return this.dealerClient.updateProfile(user.sub, dto);
    }

    @ApiOkResponse({ type: DealerClientListResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('clients')
    async getClients(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getClients(user.sub);
    }

    @ApiOkResponse({ type: DealerUserDeviceListResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('user-devices/:userId')
    async getUserDevices(@Param('userId') userId: string) {
        return this.dealerClient.getUserDevicesForCertificate(userId);
    }

    @ApiCreatedResponse({ type: DealerClientResponseDto })
    @RequiredRoles(Role.DEALER)
    @Post('clients')
    async addClient(@JwtAuthUser() user: JwtPayload, @Body() dto: AddDealerClientDto) {
        return this.dealerClient.addClient(user.sub, dto.clientUserId);
    }

    @ApiOkResponse({ type: PaginatedPointsResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('points')
    async getPointsHistory(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.dealerClient.getPointsHistory(user.sub, pagination);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @RequiredRoles(Role.DEALER)
    @Post('withdraw')
    async requestWithdrawal(@JwtAuthUser() user: JwtPayload, @Body() dto: RequestPointsWithdrawalDto) {
        return this.dealerClient.requestWithdrawal(user.sub, dto.amount, dto.cardNumber, dto.cardHolderName);
    }

    @ApiOkResponse({ type: WithdrawalListResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('withdrawals')
    async getWithdrawals(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getWithdrawals(user.sub);
    }
}
