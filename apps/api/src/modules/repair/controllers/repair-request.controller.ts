import {
    Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFiles,
    UploadedFile, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { UserClientService } from 'modules/user-client/user-client.service';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { NotificationService } from 'modules/notification/services/common-notification.service';
import { FileClientService } from 'modules/file-client/file-client.service';
import {
    CreateRepairRequestDto,
    AssignRepairerDto,
    RefuseRequestDto,
    RequestRefundDto,
    AddWorkStepDto,
    UpdateWorkStepDto,
    SetRepairPriceDto,
    AddBrokenPartDto,
    UpdateBrokenPartDto,
    UpdateBrokenPartStatusDto,
    PaginationDto,
    PaymentTargetType,
    PaymentProviderType,
    ImageTypeEnum,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
} from '@asko/shared';
import { IsOptional, IsString } from 'class-validator';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

import {
    RepairRequestResponseDto,
    RepairRequestRecordDto,
    PaginatedRepairRequestsResponseDto,
    WorkStepResponseDto,
    WorkStepListResponseDto,
    CompleteStepResponseDto,
    BrokenPartResponseDto,
    BrokenPartListResponseDto,
    EmptyResponseDto,
    ProcessInvoiceResponseDto,
    PaymentListResponseDto,
    ImageRecordDto,
    ImageListResponseDto,
} from 'common/dto/responses';

class AssignedQueryDto extends PaginationDto {
    @IsOptional()
    @IsString()
    status?: string;
}

@ApiTags('Repair Requests')
@Controller('repair-requests')
export class RepairRequestController {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
        private readonly userClient: UserClientService,
        private readonly chatClient: ChatClientService,
        private readonly paymentService: PaymentClientService,
        private readonly notificationService: NotificationService,
        private readonly fileService: FileClientService,
    ) { }

    // ── User endpoints ──

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post()
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateRepairRequestDto) {
        const result = await this.repairClient.createRequest(user.sub, dto);
        // Create group conversation linked to repair request
        try {
            const conv = await this.chatClient.createConversation(
                user.sub, 'group', `Заявка #${result.request.id.slice(0, 8)}`, [],
            );
            await this.repairClient.setConversationId(result.request.id, conv.conversation.id);
            result.request.conversationId = conv.conversation.id;
        } catch {
            // Non-critical: don't fail request creation if chat creation fails
        }
        return result;
    }

    @ApiOkResponse({ type: PaginatedRepairRequestsResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.repairClient.findByUser(user.sub, pagination);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/cancel')
    async cancel(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.cancelRequest(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/request-refund')
    async requestRefund(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: RequestRefundDto) {
        return this.repairClient.requestRefund(user.sub, id, dto.reason);
    }

    // ── Payment endpoints (stay in gateway using PaymentClientService directly) ──

    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/pay')
    async pay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.paymentService.processInvoice(
            user.sub,
            PaymentTargetType.REPAIR_REQUEST,
            id,
        );
    }

    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/dummy-pay')
    async dummyPay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.paymentService.processInvoice(
            user.sub,
            PaymentTargetType.REPAIR_REQUEST,
            id,
            PaymentProviderType.DUMMY,
        );
    }

    @ApiOkResponse({ type: PaymentListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/payments')
    async getPayments(@Param('id') id: string) {
        return this.paymentService.getPaymentsByTarget('repairRequest', id);
    }

    // ── Manager endpoints ──

    @ApiOkResponse({ type: PaginatedRepairRequestsResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        const result = await this.repairClient.findAll(pagination);
        result.data = result.data ?? [];
        // Collect all unique userIds to enrich (request owners + repairers)
        const enrichments: Promise<void>[] = [];
        for (const req of result.data) {
            if (req.userId) {
                enrichments.push(
                    this.userClient.findUserById({ id: req.userId })
                        .then((u) => { if (u) (req as any).user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                        .catch(() => {}),
                );
            }
            if ((req as any).repairer?.userId) {
                enrichments.push(
                    this.userClient.findUserById({ id: (req as any).repairer.userId })
                        .then((u) => { if (u) (req as any).repairer.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                        .catch(() => {}),
                );
            }
        }
        await Promise.all(enrichments);
        return result;
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/assign')
    async assign(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AssignRepairerDto) {
        const result = await this.repairClient.assignRepairer(user.sub, id, dto.repairerId);
        // Add repairer to conversation
        if (result.request.conversationId) {
            try {
                const { repairer } = await this.repairerClient.findRepairerById(dto.repairerId);
                if (repairer?.userId) {
                    await this.chatClient.addParticipant(result.request.conversationId, repairer.userId, user.sub);
                }
            } catch { /* non-critical */ }
        }
        return result;
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/approve-refund')
    async approveRefund(@Param('id') id: string) {
        return this.repairClient.approveRefund(id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/deny-refund')
    async denyRefund(@Param('id') id: string) {
        return this.repairClient.denyRefund(id);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/chat/accept')
    async acceptChat(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const { request } = await this.repairClient.findById(id);
        if (request.conversationId) {
            await this.chatClient.addParticipant(request.conversationId, user.sub, user.sub, true);
        }
        return {};
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/chat/detach')
    async detachChat(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        const { request } = await this.repairClient.findById(id);
        if (request.conversationId) {
            await this.chatClient.removeParticipant(request.conversationId, user.sub, user.sub);
        }
        return {};
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/reassign')
    async reassign(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AssignRepairerDto) {
        // Get old repairer before reassign
        const before = await this.repairClient.findById(id);
        const result = await this.repairClient.reassignRepairer(user.sub, id, dto.repairerId);
        if (result.request.conversationId) {
            try {
                // Remove old repairer from chat
                if (before.request.repairerId) {
                    const { repairer: oldRep } = await this.repairerClient.findRepairerById(before.request.repairerId);
                    if (oldRep?.userId) {
                        await this.chatClient.removeParticipant(result.request.conversationId, oldRep.userId, user.sub);
                    }
                }
                // Add new repairer to chat
                const { repairer: newRep } = await this.repairerClient.findRepairerById(dto.repairerId);
                if (newRep?.userId) {
                    await this.chatClient.addParticipant(result.request.conversationId, newRep.userId, user.sub);
                }
            } catch { /* non-critical */ }
        }
        return result;
    }

    // ── Repairer endpoints ──

    @ApiOkResponse({ type: PaginatedRepairRequestsResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('paused')
    async findPaused(@JwtAuthUser() user: JwtPayload, @Query() pagination: PaginationDto) {
        return this.repairClient.findPausedByRepairer(user.sub, pagination);
    }

    @ApiOkResponse({ type: RepairRequestRecordDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('active')
    async findActive(@JwtAuthUser() user: JwtPayload) {
        try {
            return await this.repairClient.findActiveByRepairer(user.sub);
        } catch {
            return null;
        }
    }

    @ApiOkResponse({ type: PaginatedRepairRequestsResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('assigned')
    async findAssigned(@JwtAuthUser() user: JwtPayload, @Query() query: AssignedQueryDto) {
        return this.repairClient.findByRepairerFiltered(user.sub, query, query.status);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/accept')
    async accept(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.acceptRequest(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/refuse')
    async refuse(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: RefuseRequestDto) {
        const result = await this.repairClient.refuseRequest(user.sub, id, dto.reason);
        // Remove repairer from conversation
        if (result.request.conversationId) {
            try {
                await this.chatClient.removeParticipant(result.request.conversationId, user.sub, user.sub);
            } catch { /* non-critical */ }
        }
        return result;
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/pause')
    async pause(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.pauseRequest(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/resume')
    async resume(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.resumeRequest(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/start')
    async start(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.startWork(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/set-price')
    async setPrice(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SetRepairPriceDto) {
        return this.repairClient.setPrice(user.sub, id, dto.amount);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/complete')
    @UseInterceptors(FilesInterceptor('files', 10))
    async complete(
        @Param('id') id: string,
        @Body('description') description?: string,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        const result = await this.repairClient.complete(id, description);

        // Upload completion images (gateway handles file uploads)
        if (files && files.length > 0) {
            for (const file of files) {
                await this.fileService.uploadRepairRequestImage(file, id);
            }
        }

        // Notify user about completion
        if (result.request) {
            this.notificationService.notifyRepairCompleted(result.request.userId, {
                type: 'repair_completed',
                requestId: result.request.id,
            });
        }

        return result;
    }

    // ── Work steps ──

    @ApiCreatedResponse({ type: WorkStepResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps')
    async addStep(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddWorkStepDto) {
        return this.repairClient.addStep(user.sub, id, dto);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/lock')
    async lockSteps(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.lockSteps(user.sub, id);
    }

    @ApiCreatedResponse({ type: WorkStepResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/:stepId/update')
    async updateStep(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('stepId') stepId: string,
        @Body() dto: UpdateWorkStepDto,
    ) {
        return this.repairClient.updateStep(user.sub, id, stepId, dto);
    }

    @ApiCreatedResponse({ type: CompleteStepResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/:stepId/complete')
    async completeStep(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Param('stepId') stepId: string) {
        return this.repairClient.completeStep(user.sub, id, stepId);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/:stepId/delete')
    async deleteStep(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Param('stepId') stepId: string) {
        return this.repairClient.deleteStep(user.sub, id, stepId);
    }

    @ApiOkResponse({ type: WorkStepListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/steps')
    async getSteps(@Param('id') id: string) {
        return this.repairClient.getSteps(id);
    }

    // ── Broken parts ──

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts')
    async addBrokenPart(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddBrokenPartDto) {
        return this.repairClient.addBrokenPart(user.sub, id, dto);
    }

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/update')
    async updateBrokenPart(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('partId') partId: string,
        @Body() dto: UpdateBrokenPartDto,
    ) {
        return this.repairClient.updateBrokenPart(user.sub, id, partId, dto);
    }

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/status')
    async updateBrokenPartStatus(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('partId') partId: string,
        @Body() dto: UpdateBrokenPartStatusDto,
    ) {
        return this.repairClient.updateBrokenPartStatus(user.sub, id, partId, dto.status);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/delete')
    async deleteBrokenPart(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('partId') partId: string,
    ) {
        await this.repairClient.deleteBrokenPart(user.sub, id, partId);
        return {};
    }

    @ApiOkResponse({ type: BrokenPartListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/broken-parts')
    async getBrokenParts(@Param('id') id: string) {
        return this.repairClient.getBrokenParts(id);
    }

    // ── Broken part images ──

    @ApiCreatedResponse({ type: ImageRecordDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/broken-parts/:partId/images')
    @UseInterceptors(FileInterceptor('file'))
    async uploadBrokenPartImage(
        @Param('partId') partId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            })
        )
        file: Express.Multer.File,
    ) {
        return this.fileService.uploadBrokenPartImage(file, partId);
    }

    @ApiOkResponse({ type: ImageListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/broken-parts/:partId/images')
    async findBrokenPartImages(@Param('partId') partId: string) {
        return this.fileService.findAttachedImages(ImageTypeEnum.BrokenPart, partId);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/images/:imageId/delete')
    async removeBrokenPartImage(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    // ── Get by ID (any authenticated user) ──

    @ApiOkResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.repairClient.findById(id);
        const req = result.request;
        if (!req) return result;

        // Enrich with user data from user-service (in parallel)
        const enrichments: Promise<void>[] = [];
        if (req.userId) {
            enrichments.push(
                this.userClient.findUserById({ id: req.userId })
                    .then((u) => { if (u) (req as any).user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                    .catch(() => {}),
            );
        }
        // Enrich nested repairer with user data
        if ((req as any).repairer?.userId) {
            enrichments.push(
                this.userClient.findUserById({ id: (req as any).repairer.userId })
                    .then((u) => { if (u) (req as any).repairer.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                    .catch(() => {}),
            );
        }
        await Promise.all(enrichments);
        return result;
    }
}
