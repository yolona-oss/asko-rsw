import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { BrokenPart } from '../entities/broken-part.entity';
import { RepairRequest } from '../entities/repair-request.entity';
import { DevicePart } from 'modules/device/entities/device-part.entity';
import { BrokenPartStatus, RepairRequestStatus, Role, ADMIN_ROLES } from '@asko/shared';
import { AppErrors } from 'common/error';
import { SupplierService } from './supplier.service';

const TERMINAL_STATUSES = [
    RepairRequestStatus.COMPLETED,
    RepairRequestStatus.CANCELLED,
    RepairRequestStatus.REFUNDED,
    RepairRequestStatus.REFUSED,
];

@Injectable()
export class BrokenPartService {
    constructor(
        private readonly em: EntityManager,
        @Inject(forwardRef(() => SupplierService))
        private readonly supplierService: SupplierService,
    ) {}

    /**
     * Assert the JWT user has a relationship with the repair request that permits the intended action.
     * - Admins bypass.
     * - Suggestion path (USER only): user must be the request creator.
     * - Staff path (REPAIRER/MANAGER): user must be the assigned repairer or manager.
     */
    private async assertCanMutate(
        userId: string,
        roles: string[],
        request: RepairRequest,
        forSuggestion: boolean,
    ): Promise<void> {
        if (roles.some(r => (ADMIN_ROLES as readonly string[]).includes(r))) return;

        if (forSuggestion) {
            if (roles.includes(Role.USER) && request.userId === userId) return;
        } else {
            if (roles.includes(Role.MANAGER) && request.managerId === userId) return;
            if (roles.includes(Role.REPAIRER)) {
                await this.em.populate(request, ['repairer']);
                if (request.repairer?.userId === userId) return;
            }
        }

        throw AppErrors.forbidden('Нет прав на изменение запчастей этой заявки');
    }

    /** Add a broken part to a repair request (staff — requires catalog part) */
    @CreateRequestContext()
    async addBrokenPart(userId: string, roles: string[], requestId: string, dto: { devicePartId?: string; name?: string; note?: string; isSuggestion?: boolean }): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const isSuggestion = dto.isSuggestion ?? false;
        await this.assertCanMutate(userId, roles, request, isSuggestion);
        let partName = dto.name;
        let devicePart: DevicePart | undefined;

        if (isSuggestion) {
            // User suggestion: name required, no catalog reference needed
            if (!partName) {
                throw AppErrors.badRequest('Необходимо указать название запчасти');
            }
        } else {
            // Staff part: must reference catalog
            if (!dto.devicePartId) {
                throw AppErrors.badRequest('Необходимо выбрать запчасть из каталога');
            }
            devicePart = await this.em.findOne(DevicePart, { id: dto.devicePartId }) ?? undefined;
            if (!devicePart) throw AppErrors.dbEntityNotFound('Device part not found');
            if (!partName) partName = devicePart.name;
        }

        if (!partName) {
            throw AppErrors.badRequest('Необходимо указать название запчасти');
        }

        const brokenPart = this.em.create(BrokenPart, {
            repairRequest: request,
            devicePart,
            name: partName,
            isSuggestion,
            note: dto.note,
            status: BrokenPartStatus.ADDED,
        });
        await this.em.persistAndFlush(brokenPart);
        return brokenPart;
    }

    /** Bulk add broken parts during repair request creation (user suggestions) */
    @CreateRequestContext()
    async addBrokenPartsOnCreate(requestId: string, parts: { devicePartId?: string; name?: string; note?: string }[]): Promise<BrokenPart[]> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        const created: BrokenPart[] = [];

        for (const dto of parts) {
            let partName = dto.name;
            let devicePart: DevicePart | undefined;

            if (dto.devicePartId) {
                devicePart = await this.em.findOne(DevicePart, { id: dto.devicePartId }) ?? undefined;
                if (devicePart && !partName) partName = devicePart.name;
            }

            if (!partName) continue;

            const brokenPart = this.em.create(BrokenPart, {
                repairRequest: request,
                devicePart,
                name: partName,
                isSuggestion: true,
                note: dto.note,
                status: BrokenPartStatus.ADDED,
            });
            this.em.persist(brokenPart);
            created.push(brokenPart);
        }

        await this.em.flush();
        return created;
    }

    /** Update broken part name/note */
    @CreateRequestContext()
    async updateBrokenPart(userId: string, roles: string[], requestId: string, partId: string, dto: { name?: string; note?: string }): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        await this.assertCanMutate(userId, roles, request, part.isSuggestion);

        if (dto.name) part.name = dto.name;
        if (dto.note !== undefined) part.note = dto.note;

        await this.em.flush();
        return part;
    }

    /** Update broken part status */
    @CreateRequestContext()
    async updateBrokenPartStatus(userId: string, roles: string[], requestId: string, partId: string, status: BrokenPartStatus): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        // Status transitions are staff-only regardless of part origin
        await this.assertCanMutate(userId, roles, request, false);

        part.status = status;
        await this.em.flush();
        return part;
    }

    /** Delete a broken part */
    @CreateRequestContext()
    async deleteBrokenPart(userId: string, roles: string[], requestId: string, partId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        await this.assertCanMutate(userId, roles, request, part.isSuggestion);

        await this.em.removeAndFlush(part);
    }

    /** Get all broken parts for a request */
    @CreateRequestContext()
    async getBrokenParts(requestId: string): Promise<BrokenPart[]> {
        return this.em.find(BrokenPart, { repairRequest: requestId }, { orderBy: { createdAt: 'ASC' } });
    }

    /** Look up a single broken part by id (with its repair request populated) */
    @CreateRequestContext()
    async findById(partId: string): Promise<BrokenPart> {
        const part = await this.em.findOne(BrokenPart, { id: partId }, { populate: ['repairRequest'] });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');
        return part;
    }

    /** Remove all suggestion broken parts for a request (called on terminal status) */
    async cleanupSuggestions(requestId: string): Promise<number> {
        return this.em.nativeDelete(BrokenPart, { repairRequest: requestId, isSuggestion: true });
    }

    /** Place a supplier order for a broken part. Transitions ADDED → ORDERED. */
    @CreateRequestContext()
    async orderFromSupplier(
        userId: string,
        roles: string[],
        requestId: string,
        partId: string,
        supplierName?: string,
    ): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя заказывать запчасти для завершённой заявки');
        }

        await this.assertCanMutate(userId, roles, request, false);

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        if (part.status !== BrokenPartStatus.ADDED) {
            throw AppErrors.badRequest('Запчасть уже была заказана');
        }

        const provider = this.supplierService.getProvider(supplierName);
        const result = await provider.orderPart({
            partId: part.id,
            name: part.name,
            note: part.note,
            requestId,
        });

        part.externalOrderId = result.externalOrderId;
        part.supplierProvider = provider.name;
        part.orderedAt = new Date();
        part.status = BrokenPartStatus.ORDERED;
        await this.em.flush();
        return part;
    }

    /** Supplier callback: transition the part to SHIPPED (or rollback on failure). */
    @CreateRequestContext()
    async handleSupplierCallback(
        partId: string,
        payload: { status: 'shipped' | 'failed'; externalOrderId: string },
    ): Promise<void> {
        const part = await this.em.findOne(BrokenPart, { id: partId });
        if (!part) return;
        if (part.externalOrderId !== payload.externalOrderId) return;

        if (payload.status === 'shipped') {
            part.status = BrokenPartStatus.SHIPPED;
        } else {
            part.status = BrokenPartStatus.ADDED;
            part.externalOrderId = undefined;
            part.supplierProvider = undefined;
            part.orderedAt = undefined;
        }
        await this.em.flush();
    }
}
