import {
    Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairAccessService } from '../services/repair-access.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';
import { UserClientService } from '@asko/gateway-common';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { RepairFileClientService } from '../services/repair-file-client.service';
import {
    CreateRepairRequestDto,
    AssignRepairerDto,
    RefuseRequestDto,
    RequestRefundDto,
    AddWorkStepDto,
    UpdateWorkStepDto,
    DeclineDiagnosticsDto,
    SetRepairPriceDto,
    AddBrokenPartDto,
    UpdateBrokenPartDto,
    UpdateBrokenPartStatusDto,
    OrderBrokenPartDto,
    GenerateAvrDto,
    VerifyAvrSigningDto,
    PaginationDto,
    PaymentTargetType,
    PaymentProviderType,
    ImageTypeEnum,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    AppErrors,
} from '@asko/shared';
import { IsOptional, IsString } from 'class-validator';
import { RequiredRoles, JwtAuthUser, isAdmin } from '@asko/gateway-common';

import { EmptyResponseDto, ImageListResponseDto } from 'common/dto/responses';
import {
    RepairRequestResponseDto,
    RepairRequestRecordDto,
    PaginatedRepairRequestsResponseDto,
    WorkStepResponseDto,
    WorkStepListResponseDto,
    CompleteStepResponseDto,
    BrokenPartResponseDto,
    BrokenPartListResponseDto,
} from '../dto/repair.response.dto';
import { ProcessInvoiceResponseDto, PaymentListResponseDto } from 'modules/payment/dto/payment.response.dto';

function parseRepairTimestamps(record: any): void {
    if (typeof record?.statusTimestamps === 'string' && record.statusTimestamps) {
        try { record.statusTimestamps = JSON.parse(record.statusTimestamps); } catch { /* keep string */ }
    }
}

class RepairQueryDto extends PaginationDto {
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
        private readonly fileService: RepairFileClientService,
        private readonly repairAccess: RepairAccessService,
    ) { }

    // ── Stats ──

    @RequiredRoles(...ADMIN_ROLES, Role.MANAGER)
    @Get('metrics/completion')
    async getCompletionMetrics(
        @Query('dateFrom') dateFrom: string,
        @Query('dateTo') dateTo: string,
    ) {
        return this.repairClient.getCompletionMetrics(dateFrom, dateTo);
    }

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
    async findMy(@JwtAuthUser() user: JwtPayload, @Query() query: RepairQueryDto) {
        const result = await this.repairClient.findByUser(user.sub, query);
        for (const req of result.data ?? []) parseRepairTimestamps(req);
        return result;
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

    // ── Payment endpoints ──

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
    async findAll(@Query() query: RepairQueryDto) {
        const result = await this.repairClient.findAll(query);
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
        for (const req of result.data) parseRepairTimestamps(req);
        return result;
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/assign')
    async assign(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AssignRepairerDto) {
        await this.repairAccess.assertManagerOwnership(user, id);
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
    async approveRefund(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.repairAccess.assertManagerOwnership(user, id);
        return this.repairClient.approveRefund(id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/deny-refund')
    async denyRefund(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.repairAccess.assertManagerOwnership(user, id);
        return this.repairClient.denyRefund(id);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/chat/accept')
    async acceptChat(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.repairAccess.assertManagerOwnership(user, id);
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
        await this.repairAccess.assertManagerOwnership(user, id);
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
        await this.repairAccess.assertManagerOwnership(user, id);
        // Get old repairer before reassign
        const before = await this.repairClient.findById(id);
        const result = await this.repairClient.reassignRepairer(user.sub, id, dto.repairerId);
        if (result.request.conversationId) {
            // Remove old repairer from chat
            if (before.request.repairerId) {
                try {
                    const { repairer: oldRep } = await this.repairerClient.findRepairerById(before.request.repairerId);
                    if (oldRep?.userId) {
                        await this.chatClient.removeParticipant(result.request.conversationId, oldRep.userId, user.sub, true);
                    }
                } catch { /* non-critical */ }
            }
            // Add new repairer to chat
            try {
                const { repairer: newRep } = await this.repairerClient.findRepairerById(dto.repairerId);
                if (newRep?.userId) {
                    await this.chatClient.addParticipant(result.request.conversationId, newRep.userId, user.sub, true);
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
        const result = await this.repairClient.findPausedByRepairer(user.sub, pagination);
        for (const req of result.data ?? []) parseRepairTimestamps(req);
        return result;
    }

    @ApiOkResponse({ type: RepairRequestRecordDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('active')
    async findActive(@JwtAuthUser() user: JwtPayload) {
        try {
            const result = await this.repairClient.findActiveByRepairer(user.sub);
            if (result?.request) parseRepairTimestamps(result.request);
            return result;
        } catch {
            return null;
        }
    }

    @ApiOkResponse({ type: PaginatedRepairRequestsResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Get('assigned')
    async findAssigned(@JwtAuthUser() user: JwtPayload, @Query() query: RepairQueryDto) {
        const result = await this.repairClient.findByRepairerFiltered(user.sub, query, query.status, query.search);
        for (const req of result.data ?? []) parseRepairTimestamps(req);
        return result;
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/accept-completion')
    async acceptCompletion(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.acceptCompletion(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/accept')
    async accept(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.acceptRequest(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/depart')
    async depart(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.depart(user.sub, id);
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
    @Post(':id/confirm-presence')
    async confirmSchedulePresence(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.confirmSchedulePresence(user.sub, id);
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

    // ── AVR (Work Completion Act) ──

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/avr/generate')
    async generateAvr(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: GenerateAvrDto,
    ) {
        // Fetch request owner info from user-service
        const { request: reqRecord } = await this.repairClient.findById(id);
        const ownerUser = await this.userClient.findUserById({ id: reqRecord!.userId });
        const repairerUser = await this.userClient.findUserById({ id: user.sub });

        const ownerName = [ownerUser.lastName, ownerUser.firstName].filter(Boolean).join(' ') || '';
        const repairerName = [repairerUser.lastName, repairerUser.firstName].filter(Boolean).join(' ') || '';

        // Generate AVR PDF via repair-service
        const avrResult = await this.repairClient.generateAvr(user.sub, id, {
            completionNote: dto.completionNote,
            userName: ownerName,
            userPhone: ownerUser.phone ?? '',
            userEmail: ownerUser.email ?? '',
            repairerName,
        });

        // Upload PDF to file-service
        const filename = `avr-${id.slice(0, 8)}.pdf`;
        const docResult = await this.fileService.uploadDocumentBuffer(
            Buffer.from(avrResult.pdfBuffer),
            filename,
            'avr',
            id,
            reqRecord!.userId,
        );

        // Store document ID on the request
        await this.repairClient.setAvrDocumentId(id, docResult.document!.id);

        return { request: reqRecord, avrDocumentId: docResult.document!.id };
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/avr/reset')
    async resetAvr(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.resetAvr(user.sub, id);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/avr/remove')
    async removeAvrByManager(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        await this.repairAccess.assertManagerOwnership(user, id);
        return this.repairClient.removeAvrByManager(user.sub, id);
    }

    @ApiCreatedResponse()
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/avr/sign/initiate')
    async initiateAvrSigning(@Param('id') id: string) {
        const { request } = await this.repairClient.findById(id);
        const result = await this.userClient.sendSigningOtp({ userId: request!.userId });
        await this.repairClient.setAvrPendingSignature(id);
        return result;
    }

    @ApiCreatedResponse()
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/avr/sign/resend')
    async resendAvrOtp(@Param('id') id: string) {
        const { request } = await this.repairClient.findById(id);
        return this.userClient.sendSigningOtp({ userId: request!.userId });
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/avr/sign/verify')
    async verifyAvrSigning(
        @Param('id') id: string,
        @Body() dto: VerifyAvrSigningDto,
    ) {
        const { request } = await this.repairClient.findById(id);
        const userId = request!.userId;

        if (dto.password) {
            const { valid } = await this.userClient.verifyPasswordForSigning({ userId, password: dto.password });
            if (!valid) throw new Error('Неверный пароль');
        } else if (dto.code) {
            const { valid } = await this.userClient.verifySigningOtp({ userId, code: dto.code });
            if (!valid) throw new Error('Неверный код');
        } else {
            throw new Error('Необходимо указать код или пароль');
        }

        return this.repairClient.signAvrDigital(id, userId);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/avr/offline/confirm')
    async confirmAvrOffline(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
    ) {
        return this.repairClient.uploadAvrScan(id, user.sub);
    }

    @ApiCreatedResponse({ type: RepairRequestResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/avr/scan/upload')
    @UseInterceptors(FilesInterceptor('file', 1))
    async uploadAvrScan(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        let signedDocumentId: string | undefined;
        if (files && files.length > 0) {
            const { request } = await this.repairClient.findById(id);
            const docResult = await this.fileService.uploadDocumentFile(
                files[0],
                'avr-signed',
                id,
                request!.userId,
            );
            signedDocumentId = docResult.document!.id;
        }

        return this.repairClient.uploadAvrScan(id, user.sub, signedDocumentId);
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

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/diagnostics/approve')
    async approveDiagnostics(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.repairClient.approveDiagnostics(user.sub, id);
    }

    @ApiCreatedResponse({ type: WorkStepListResponseDto })
    @RequiredRoles(Role.REPAIRER)
    @Post(':id/steps/diagnostics/decline')
    async declineDiagnostics(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: DeclineDiagnosticsDto,
    ) {
        return this.repairClient.declineDiagnostics(user.sub, id, dto.reason);
    }

    // ── Broken parts ──

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts')
    async addBrokenPart(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddBrokenPartDto) {
        return this.repairClient.addBrokenPart(user.sub, user.roles, id, { ...dto, isSuggestion: false });
    }

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.USER)
    @Post(':id/broken-parts/suggest')
    async suggestBrokenPart(@JwtAuthUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddBrokenPartDto) {
        return this.repairClient.addBrokenPart(user.sub, user.roles, id, { name: dto.name, note: dto.note, isSuggestion: true });
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
        return this.repairClient.updateBrokenPart(user.sub, user.roles, id, partId, dto);
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
        return this.repairClient.updateBrokenPartStatus(user.sub, user.roles, id, partId, dto.status);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/delete')
    async deleteBrokenPart(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('partId') partId: string,
    ) {
        await this.repairClient.deleteBrokenPart(user.sub, user.roles, id, partId);
        return {};
    }

    @ApiCreatedResponse({ type: BrokenPartResponseDto })
    @RequiredRoles(Role.REPAIRER, Role.MANAGER, ...ADMIN_ROLES)
    @Post(':id/broken-parts/:partId/order')
    async orderBrokenPart(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Param('partId') partId: string,
        @Body() dto: OrderBrokenPartDto,
    ) {
        return this.repairClient.orderBrokenPart(user.sub, user.roles, id, partId, dto.supplier);
    }

    @ApiOkResponse({ type: BrokenPartListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/broken-parts')
    async getBrokenParts(@Param('id') id: string) {
        return this.repairClient.getBrokenParts(id);
    }

    // ── Broken part images ──

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
        parseRepairTimestamps(req);
        return result;
    }
}
