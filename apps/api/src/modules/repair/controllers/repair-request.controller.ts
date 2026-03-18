import { Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RepairRequestService } from '../services/repair-request.service';
import { WorkStepService } from '../services/work-step.service';
import { RepairPaymentService } from '../services/repair-payment.service';
import {
    CreateRepairRequestDto,
    AssignRepairerDto,
    RefuseRequestDto,
    RequestRefundDto,
    AddWorkStepDto,
    UpdateWorkStepDto,
    CreateRepairPaymentDto,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    STAFF_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('repair-requests')
export class RepairRequestController {
    constructor(
        private readonly repairRequestService: RepairRequestService,
        private readonly workStepService: WorkStepService,
        private readonly repairPaymentService: RepairPaymentService,
    ) {}

    // ── User endpoints ──

    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateRepairRequestDto) {
        return this.repairRequestService.create(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.repairRequestService.findByUser(user.sub, pagination);
    }

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/cancel')
    async cancel(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairRequestService.cancel(user.sub, id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/request-refund')
    async requestRefund(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: RequestRefundDto) {
        return this.repairRequestService.requestRefund(user.sub, id, dto);
    }

    // ── Payment endpoints ──

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/pay')
    async pay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateRepairPaymentDto) {
        dto.repairRequestId = id;
        return this.repairPaymentService.createPayment(user.sub, dto);
    }

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/payments/:paymentId/confirm')
    async confirmPayment(@Param('paymentId') paymentId: string) {
        return this.repairPaymentService.confirmPayment(paymentId);
    }

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/payments/:paymentId/fail')
    async failPayment(@Param('paymentId') paymentId: string) {
        return this.repairPaymentService.failPayment(paymentId);
    }

    @RequiredRoles(...ALL_ROLES)
    @Post(':id/dummy-pay')
    async dummyPay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairPaymentService.createDummyPayment(id, user.sub);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id/payments')
    async getPayments(@Param('id') id: string) {
        return this.repairPaymentService.getPaymentsByRequest(id);
    }

    // ── Manager endpoints ──

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.repairRequestService.findAll(pagination);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/assign')
    async assign(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AssignRepairerDto) {
        return this.repairRequestService.assignRepairer(user.sub, id, dto);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/approve-refund')
    async approveRefund(@Param('id') id: string) {
        return this.repairRequestService.approveRefund(id);
    }

    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/deny-refund')
    async denyRefund(@Param('id') id: string) {
        return this.repairRequestService.denyRefund(id);
    }

    // ── Repairer endpoints ──

    @RequiredRoles(Role.REPAIRER)
    @Get('assigned')
    async findAssigned(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.repairRequestService.findByRepairer(user.sub, pagination);
    }

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/accept')
    async accept(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairRequestService.acceptRequest(user.sub, id);
    }

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/refuse')
    async refuse(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: RefuseRequestDto) {
        return this.repairRequestService.refuseRequest(user.sub, id, dto);
    }

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/start')
    async start(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairRequestService.startWork(user.sub, id);
    }

    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/complete')
    @UseInterceptors(FilesInterceptor('files', 10))
    async complete(
        @Param('id') id: string,
        @Body('description') description?: string,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        return this.repairRequestService.complete(id, description, files);
    }

    // ── Work steps ──

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps')
    async addStep(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddWorkStepDto) {
        return this.workStepService.addStep(user.sub, id, dto);
    }

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/:stepId/update')
    async updateStep(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('stepId') stepId: string,
        @Body() dto: UpdateWorkStepDto,
    ) {
        return this.workStepService.updateStep(user.sub, id, stepId, dto);
    }

    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/:stepId/complete')
    async completeStep(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Param('stepId') stepId: string) {
        return this.workStepService.completeStep(user.sub, id, stepId);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id/steps')
    async getSteps(@Param('id') id: string) {
        return this.workStepService.getSteps(id);
    }

    // ── Get by ID (any authenticated user) ──

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.repairRequestService.findById(id);
    }
}
