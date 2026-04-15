import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { EntityManager } from '@mikro-orm/postgresql';
import { CertificateService } from 'services/certificate.service';
import { RepairRequestService } from 'services/repair-request.service';
import { DeviceService } from 'services/device.service';
import { SignatureService } from 'services/signature.service';
import { AppError, AppErrors } from 'common/error';
import type { Certificate } from 'entities/certificate.entity';
import type { UserDevice } from 'entities/user-device.entity';
import type { Device } from 'entities/device.entity';
import type { Address } from 'entities/address.entity';
import type { DealerProfile } from 'entities/dealer-profile.entity';
import { DealerProfile as DealerProfileEntity } from 'entities/dealer-profile.entity';

import type {
    CertAddCertificateRequest,
    CertCreateByDealerRequest,
    CertSelfCreateRequest,
    CertMarkPaidRequest,
    CertRevokeRequest,
    CertReassignRequest,
    CertReapplyRequest,
    CertDismissReminderRequest,
    CertCalculatePriceRequest,
    CertFindByIdRequest,
    CertFindByUserRequest,
    CertFindByDealerRequest,
    CertFindAllRequest,
    CertValidateRequest,
    VerifySignatureRequest,
    SignatureEmptyRequest,
    GenerateCertificatePdfRequest,
    SetCertPdfDocIdRequest,
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
        type: entity.category?.name ?? '',
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
        building: parseInt(entity.building ?? '') || 0,
        floor: parseInt(entity.floor ?? '') || 0,
        room: parseInt(entity.apartment ?? '') || 0,
        postalCode: '',
        latitude: entity.latitude ?? 0,
        longitude: entity.longitude ?? 0,
        validationStatus: entity.validationStatus ?? 'pending',
        validationError: entity.validationError ?? '',
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
        signature: entity.signature ?? '',
        signedPayload: entity.signedPayload ?? '',
        pdfDocumentId: entity.pdfDocumentId ?? '',
        userDevice: userDevice ? userDeviceToRecord(userDevice) : undefined,
        dealer: dealer ? dealerToRecord(dealer) : undefined,
    };
}

@Controller()
export class CertificateGrpcController {
    constructor(
        private readonly certificateService: CertificateService,
        private readonly signatureService: SignatureService,
        private readonly repairRequestService: RepairRequestService,
        private readonly deviceService: DeviceService,
        private readonly em: EntityManager,
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

    @GrpcMethod('CertificateService', 'SelfCreate')
    async selfCreate(data: CertSelfCreateRequest) {
        try {
            const cert = await this.certificateService.selfCreate(data.userId, {
                userDeviceId: data.userDeviceId,
                expiresAt: data.expiresAt,
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

    @GrpcMethod('CertificateService', 'ReapplyCertificate')
    async reapplyCertificate(data: CertReapplyRequest) {
        try {
            const cert = await this.certificateService.reapplyCertificate(data.userId, data.sourceCertId, {
                durationMonths: data.durationMonths,
                description: data.description || undefined,
            });
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'DismissExpiryReminder')
    async dismissExpiryReminder(data: CertDismissReminderRequest) {
        try {
            const cert = await this.certificateService.dismissExpiryReminder(data.userId, data.certId);
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
                { page: data.page, limit: data.limit, search: data.search || undefined, sortBy: data.sortBy || undefined, sortOrder: data.sortOrder || undefined, dateFrom: data.dateFrom || undefined, dateTo: data.dateTo || undefined },
                data.status || undefined,
            );
            return {
                data: result.data.map(certToRecord),
                overallCount: result.total,
                page: data.page,
                limit: data.limit,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'FindAll')
    async findAll(data: CertFindAllRequest) {
        try {
            const result = await this.certificateService.findAll(
                {
                    page: data.page,
                    limit: data.limit,
                    search: data.search || undefined,
                    sortBy: data.sortBy || undefined,
                    sortOrder: data.sortOrder || undefined,
                    dateFrom: data.dateFrom || undefined,
                    dateTo: data.dateTo || undefined,
                },
                data.status || undefined,
            );
            return {
                data: result.data.map(certToRecord),
                overallCount: result.total,
                page: data.page,
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

    @GrpcMethod('CertificateService', 'VerifySignature')
    async verifySignature(data: VerifySignatureRequest) {
        try {
            let signature: string | null | undefined;
            let signedPayload: string | null | undefined;

            switch (data.entityType) {
                case 'certificate': {
                    const cert = await this.certificateService.findById(data.entityId);
                    signature = cert.signature;
                    signedPayload = cert.signedPayload;
                    break;
                }
                case 'repairRequest': {
                    const request = await this.repairRequestService.findById(data.entityId);
                    signature = request.completionSignature;
                    signedPayload = request.completionSignedPayload;
                    break;
                }
                case 'userDevice': {
                    const userDevice = await this.deviceService.findUserDeviceById(data.entityId);
                    signature = userDevice.registrationSignature;
                    signedPayload = userDevice.registrationSignedPayload;
                    break;
                }
                case 'dealerProfile': {
                    const dealer = await this.em.findOne(DealerProfileEntity, { id: data.entityId });
                    if (!dealer) throw AppErrors.dbEntityNotFound('Dealer profile not found');
                    signature = dealer.agreementSignature;
                    signedPayload = dealer.agreementSignedPayload;
                    break;
                }
                default:
                    throw AppErrors.badRequest(`Unknown entity type: ${data.entityType}`);
            }

            const result = this.signatureService.verifyStoredSignature(signedPayload, signature);
            return {
                valid: result.valid,
                reason: result.reason ?? '',
                signedPayload: signedPayload ?? '',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'GetPublicKey')
    async getPublicKey(_data: SignatureEmptyRequest) {
        try {
            return {
                publicKeyPem: this.signatureService.getPublicKeyPem(),
                algorithm: 'ECDSA-P256-SHA256',
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'GenerateCertificatePdf')
    async generateCertificatePdf(data: GenerateCertificatePdfRequest) {
        try {
            const { pdfBuffer, certificate } = await this.certificateService.generatePdf(data.certId, {
                deviceName: data.deviceName,
                deviceBrand: data.deviceBrand,
                deviceModel: data.deviceModel,
                deviceDescription: data.deviceDescription,
                deviceImage: data.deviceImage?.length ? Buffer.from(data.deviceImage) : undefined,
            });
            return { pdfBuffer, certId: certificate.id };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('CertificateService', 'SetCertificatePdfDocumentId')
    async setCertificatePdfDocumentId(data: SetCertPdfDocIdRequest) {
        try {
            const cert = await this.certificateService.setPdfDocumentId(data.certId, data.documentId);
            return { certificate: certToRecord(cert) };
        } catch (e) { throw toGrpcError(e); }
    }
}
