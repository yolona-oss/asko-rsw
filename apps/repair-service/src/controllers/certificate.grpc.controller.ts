import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CertificateService } from 'services/certificate.service';
import { AppError } from 'common/error';
import type { Certificate } from 'entities/certificate.entity';
import type { UserDevice } from 'entities/user-device.entity';
import type { Device } from 'entities/device.entity';
import type { Address } from 'entities/address.entity';
import type { DealerProfile } from 'entities/dealer-profile.entity';

import type {
    CertAddCertificateRequest,
    CertCreateByDealerRequest,
    CertMarkPaidRequest,
    CertRevokeRequest,
    CertReassignRequest,
    CertCalculatePriceRequest,
    CertFindByIdRequest,
    CertFindByUserRequest,
    CertFindByDealerRequest,
    CertFindAllRequest,
    CertValidateRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

function deviceToRecord(entity: Device) {
    return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        model: entity.model,
        brand: entity.brand,
        price: entity.price ?? 0,
        description: entity.description ?? '',
        specifications: entity.specifications ? JSON.stringify(entity.specifications) : '',
        features: entity.features ? JSON.stringify(entity.features) : '',
        slug: entity.slug,
        isFeatured: entity.isFeatured ?? false,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function addressToRecord(entity: Address) {
    return {
        id: entity.id,
        country: '',
        city: entity.city,
        street: entity.street,
        house: parseInt(entity.house) || 0,
        building: 0,
        floor: parseInt(entity.floor ?? '') || 0,
        room: parseInt(entity.apartment ?? '') || 0,
        postalCode: '',
    };
}

function userDeviceToRecord(entity: UserDevice) {
    const device = typeof entity.device === 'object' ? entity.device : null;
    const address = typeof entity.address === 'object' ? entity.address : null;
    return {
        id: entity.id,
        userId: entity.userId,
        deviceId: device?.id ?? '',
        serialNumber: entity.serialNumber,
        addressId: address?.id ?? '',
        purchaseDate: entity.purchaseDate?.toISOString() ?? '',
        warrantyUntil: entity.warrantyUntil?.toISOString() ?? '',
        notes: entity.notes ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        device: device ? deviceToRecord(device) : undefined,
        address: address ? addressToRecord(address) : undefined,
    };
}

function dealerToRecord(entity: DealerProfile) {
    return {
        id: entity.id,
        userId: entity.userId,
        companyName: entity.companyName ?? '',
        inn: entity.inn ?? '',
        pointsBalance: entity.pointsBalance,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function certToRecord(entity: Certificate) {
    const userDevice = typeof entity.userDevice === 'object' ? entity.userDevice : null;
    const dealer = typeof entity.dealer === 'object' ? entity.dealer : null;

    return {
        id: entity.id,
        userId: entity.userId,
        userDeviceId: userDevice ? userDevice.id : String(entity.userDevice ?? ''),
        dealerId: dealer ? dealer.id : (entity.dealer ? String(entity.dealer) : ''),
        certificateNumber: entity.certificateNumber,
        status: entity.status,
        issuedAt: entity.issuedAt?.toISOString() ?? '',
        expiresAt: entity.expiresAt?.toISOString() ?? '',
        price: entity.price ?? 0,
        paid: entity.paid,
        purchaseReceiptUrl: entity.purchaseReceiptUrl ?? '',
        description: entity.description ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        userDevice: userDevice ? userDeviceToRecord(userDevice) : undefined,
        dealer: dealer ? dealerToRecord(dealer) : undefined,
    };
}

@Controller()
export class CertificateGrpcController {
    constructor(
        private readonly certificateService: CertificateService,
    ) {}

    @GrpcMethod('CertificateService', 'AddCertificate')
    async addCertificate(data: CertAddCertificateRequest) {
        try {
            const cert = await this.certificateService.addCertificate(data.userId, {
                userDeviceId: data.userDeviceId,
                certificateNumber: data.certificateNumber,
                expiresAt: data.expiresAt,
            });
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'CreateByDealer')
    async createByDealer(data: CertCreateByDealerRequest) {
        try {
            const cert = await this.certificateService.createByDealer({
                clientUserId: data.clientUserId,
                userDeviceId: data.userDeviceId,
                dealerId: data.dealerId,
                expiresAt: data.expiresAt,
                serialNumber: data.serialNumber,
                purchaseReceiptUrl: data.purchaseReceiptUrl || undefined,
                description: data.description || undefined,
            });
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'MarkPaid')
    async markPaid(data: CertMarkPaidRequest) {
        try {
            const cert = await this.certificateService.markPaid(data.id);
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'RevokeCertificate')
    async revokeCertificate(data: CertRevokeRequest) {
        try {
            const cert = await this.certificateService.revokeCertificate(data.id);
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'ReassignCertificate')
    async reassignCertificate(data: CertReassignRequest) {
        try {
            const cert = await this.certificateService.reassignCertificate(data.userId, data.certId, data.userDeviceId);
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'CalculatePrice')
    async calculatePrice(data: CertCalculatePriceRequest) {
        try {
            const result = await this.certificateService.calculatePrice(data.userDeviceId, data.expiresAt);
            return { price: result.price };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'FindById')
    async findById(data: CertFindByIdRequest) {
        try {
            const cert = await this.certificateService.findById(data.id);
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'FindByUser')
    async findByUser(data: CertFindByUserRequest) {
        try {
            const certs = await this.certificateService.findByUser(data.userId);
            return { certificates: certs.map(certToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'FindByDealer')
    async findByDealer(data: CertFindByDealerRequest) {
        try {
            const result = await this.certificateService.findByDealer(
                data.dealerId,
                { offset: data.offset, limit: data.limit, search: data.search || undefined },
                data.status || undefined,
            );
            return {
                data: result.data.map(certToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'FindAll')
    async findAll(data: CertFindAllRequest) {
        try {
            const result = await this.certificateService.findAll({
                offset: data.offset,
                limit: data.limit,
                search: data.search || undefined,
            });
            return {
                data: result.data.map(certToRecord),
                overallCount: result.total,
                offset: data.offset,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'ValidateCertificate')
    async validateCertificate(data: CertValidateRequest) {
        try {
            const result = await this.certificateService.validateCertificate(data.certificateNumber);
            return {
                valid: result.valid,
                certificate: result.certificate ? certToRecord(result.certificate) : undefined,
            };
        } catch (e) { throw toGrpcError(e); }
    }
}
