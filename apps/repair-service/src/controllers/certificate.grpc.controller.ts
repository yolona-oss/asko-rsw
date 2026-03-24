import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CertificateService } from 'services/certificate.service';
import { AppError } from 'common/error';
import type { Certificate } from 'entities/certificate.entity';

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

function certToRecord(entity: Certificate) {
    const userDeviceId = typeof entity.userDevice === 'object' ? entity.userDevice.id : String(entity.userDevice ?? '');
    const dealerId = typeof entity.dealer === 'object' ? entity.dealer?.id ?? '' : String(entity.dealer ?? '');

    return {
        id: entity.id,
        userId: entity.userId,
        userDeviceId,
        dealerId,
        certificateNumber: entity.certificateNumber,
        status: entity.status,
        issuedAt: entity.issuedAt?.toISOString() ?? '',
        expiresAt: entity.expiresAt?.toISOString() ?? '',
        price: entity.price ?? 0,
        paid: entity.paid,
        purchaseReceiptUrl: entity.purchaseReceiptUrl ?? '',
        description: entity.description ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
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
