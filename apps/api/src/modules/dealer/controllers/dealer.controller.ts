import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DealerService } from '../services/dealer.service';
import {
    CreateDealerProfileDto,
    UpdateDealerProfileDto,
    AddDealerClientDto,
    RequestPointsWithdrawalDto,
    ProcessWithdrawalDto,
    PaginationDto,
    ADMIN_ROLES,
    STAFF_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('dealers')
export class DealerController {
    constructor(private readonly dealerService: DealerService) {}

    // ── Admin ──

    @RequiredRoles(...ADMIN_ROLES)
    @Post()
    async createProfile(@Body() dto: CreateDealerProfileDto) {
        return this.dealerService.createProfile(dto);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.dealerService.findAll(pagination);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Get('withdrawals/all')
    async getAllWithdrawals(@Query() pagination: PaginationDto) {
        return this.dealerService.getAllWithdrawals(pagination);
    }

    @RequiredRoles(...ADMIN_ROLES)
    @Post('withdrawals/:id/process')
    async processWithdrawal(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ProcessWithdrawalDto,
    ) {
        return this.dealerService.processWithdrawal(id, user.sub, dto);
    }

    // ── Dealer ──

    @RequiredRoles(Role.DEALER)
    @Get('profile')
    async getProfile(@JwtAuthUser() user: JwtPayload) {
        return this.dealerService.getProfile(user.sub);
    }

    @RequiredRoles(Role.DEALER)
    @Patch('profile')
    async updateProfile(@JwtAuthUser() user: JwtPayload, @Body() dto: UpdateDealerProfileDto) {
        return this.dealerService.updateProfile(user.sub, dto);
    }

    @RequiredRoles(Role.DEALER)
    @Get('clients')
    async getClients(@JwtAuthUser() user: JwtPayload) {
        return this.dealerService.getClients(user.sub);
    }

    @RequiredRoles(Role.DEALER)
    @Get('search-user')
    async searchUser(@Query('email') email: string) {
        return this.dealerService.searchUserByEmail(email);
    }

    @RequiredRoles(Role.DEALER)
    @Get('user-devices/:userId')
    async getUserDevices(@Param('userId') userId: string) {
        return this.dealerService.getUserDevicesForCertificate(userId);
    }

    @RequiredRoles(Role.DEALER)
    @Post('clients')
    async addClient(@JwtAuthUser() user: JwtPayload, @Body() dto: AddDealerClientDto) {
        return this.dealerService.addClient(user.sub, dto);
    }

    @RequiredRoles(Role.DEALER)
    @Get('points')
    async getPointsHistory(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.dealerService.getPointsHistory(user.sub, pagination);
    }

    @RequiredRoles(Role.DEALER)
    @Post('withdraw')
    async requestWithdrawal(@JwtAuthUser() user: JwtPayload, @Body() dto: RequestPointsWithdrawalDto) {
        return this.dealerService.requestWithdrawal(user.sub, dto);
    }

    @RequiredRoles(Role.DEALER)
    @Get('withdrawals')
    async getWithdrawals(@JwtAuthUser() user: JwtPayload) {
        return this.dealerService.getWithdrawals(user.sub);
    }
}
