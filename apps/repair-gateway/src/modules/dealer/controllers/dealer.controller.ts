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
    JwtPayload,
    WithdrawalStatus,
} from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import { JwtAuthUser } from '@asko/gateway-common';
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
    @Permissions(Permission.DEALER_MANAGE)
    @Post()
    async createProfile(@Body() dto: CreateDealerProfileDto) {
        return this.dealerClient.createProfile(dto.userId, {
            companyName: dto.companyName,
            inn: dto.inn,
        });
    }

    @ApiOkResponse({ type: PaginatedDealersResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.dealerClient.findAllDealers(pagination);
    }

    @ApiOkResponse({ type: PaginatedWithdrawalsResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
    @Get('withdrawals/all')
    async getAllWithdrawals(@Query() pagination: PaginationDto) {
        return this.dealerClient.getAllWithdrawals(pagination);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
    @Post('withdrawals/:id/process')
    async processWithdrawal(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ProcessWithdrawalDto,
    ) {
        return this.dealerClient.processWithdrawal(id, user.sub, dto.status);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.APPROVED);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.dealerClient.processWithdrawal(id, user.sub, WithdrawalStatus.REJECTED);
    }

    @ApiCreatedResponse({ type: PayoutResponseDto })
    @Permissions(Permission.DEALER_MANAGE)
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
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('search-user')
    async searchUser(@Query('email') email: string) {
        return this.userClient.findUserByEmail(email);
    }

    @ApiOkResponse({ type: DealerProfileResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('profile')
    async getProfile(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getProfile(user.sub);
    }

    @ApiOkResponse({ type: DealerProfileResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Patch('profile')
    async updateProfile(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateDealerProfileDto) {
        return this.dealerClient.updateProfile(user.sub, dto);
    }

    @ApiOkResponse({ type: DealerClientListResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('clients')
    async getClients(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getClients(user.sub);
    }

    @ApiOkResponse({ type: DealerUserDeviceListResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('user-devices/:userId')
    async getUserDevices(@Param('userId') userId: string) {
        return this.dealerClient.getUserDevicesForCertificate(userId);
    }

    @ApiCreatedResponse({ type: DealerClientResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Post('clients')
    async addClient(@JwtAuthUser() user: JwtPayload, @Body() dto: AddDealerClientDto) {
        return this.dealerClient.addClient(user.sub, dto.clientUserId);
    }

    @ApiOkResponse({ type: PaginatedPointsResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('points')
    async getPointsHistory(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.dealerClient.getPointsHistory(user.sub, pagination);
    }

    @ApiCreatedResponse({ type: WithdrawalResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Post('withdraw')
    async requestWithdrawal(@JwtAuthUser() user: JwtPayload, @Body() dto: RequestPointsWithdrawalDto) {
        return this.dealerClient.requestWithdrawal(user.sub, dto.amount, dto.cardNumber, dto.cardHolderName);
    }

    @ApiOkResponse({ type: WithdrawalListResponseDto })
    @Permissions(Permission.DEALER_OWN_PROFILE)
    @Get('withdrawals')
    async getWithdrawals(@JwtAuthUser() user: JwtPayload) {
        return this.dealerClient.getWithdrawals(user.sub);
    }
}
