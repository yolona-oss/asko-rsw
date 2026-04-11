import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { BrokenPart } from 'entities/broken-part.entity';
import { RepairRequest } from 'entities/repair-request.entity';
import { DevicePart } from 'entities/device-part.entity';
import { BrokenPartStatus, RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';
import { SupplierService } from 'providers/supplier/supplier.service';

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

    /** Add a broken part to a repair request */
    @CreateRequestContext()
    async addBrokenPart(requestId: string, dto: { devicePartId?: string; name?: string; note?: string }): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        let partName = dto.name;
        let devicePart: DevicePart | undefined;

        if (dto.devicePartId) {
            devicePart = await this.em.findOne(DevicePart, { id: dto.devicePartId }) ?? undefined;
            if (!devicePart) throw AppErrors.dbEntityNotFound('Device part not found');
            if (!partName) partName = devicePart.name;
        }

        if (!partName) {
            throw AppErrors.badRequest('Необходимо указать название запчасти или выбрать из каталога');
        }

        const brokenPart = this.em.create(BrokenPart, {
            repairRequest: request,
            devicePart,
            name: partName,
            note: dto.note,
            status: BrokenPartStatus.ADDED,
        });
        await this.em.persistAndFlush(brokenPart);
        return brokenPart;
    }

    /** Bulk add broken parts during repair request creation */
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
    async updateBrokenPart(requestId: string, partId: string, dto: { name?: string; note?: string }): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        if (dto.name) part.name = dto.name;
        if (dto.note !== undefined) part.note = dto.note;

        await this.em.flush();
        return part;
    }

    /** Update broken part status */
    @CreateRequestContext()
    async updateBrokenPartStatus(requestId: string, partId: string, status: BrokenPartStatus): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        part.status = status;
        await this.em.flush();
        return part;
    }

    /** Delete a broken part */
    @CreateRequestContext()
    async deleteBrokenPart(requestId: string, partId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя изменять запчасти для завершённой заявки');
        }

        const part = await this.em.findOne(BrokenPart, { id: partId, repairRequest: requestId });
        if (!part) throw AppErrors.dbEntityNotFound('Broken part not found');

        await this.em.removeAndFlush(part);
    }

    /** Get all broken parts for a request */
    @CreateRequestContext()
    async getBrokenParts(requestId: string): Promise<BrokenPart[]> {
        return this.em.find(BrokenPart, { repairRequest: requestId }, { orderBy: { createdAt: 'ASC' } });
    }

    /** Place a supplier order for a broken part. Transitions ADDED → ORDERED. */
    @CreateRequestContext()
    async orderFromSupplier(
        _userId: string,
        requestId: string,
        partId: string,
        supplierName?: string,
    ): Promise<BrokenPart> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя заказывать запчасти для завершённой заявки');
        }

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
