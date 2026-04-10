import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    CertificateServiceClient,
    CertificateResponse,
    CertificateListResponse,
    PaginatedCertificatesResponse,
    CertPriceResponse,
    CertValidateResponse,
    VerifySignatureResponse,
    PublicKeyResponse,
} from '@asko/proto';

@Injectable()
export class CertificateClientService implements OnModuleInit {
    private certificateService!: CertificateServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.certificateService = this.client.getService<CertificateServiceClient>('CertificateService');
    }

    // ─── Add / Create ──────────────────────────────────────────────────────

    addCertificate(userId: string, dto: {
        userDeviceId: string;
        certificateNumber: string;
        expiresAt: string;
    }): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.addCertificate({
            userId,
            userDeviceId: dto.userDeviceId,
            certificateNumber: dto.certificateNumber,
            expiresAt: dto.expiresAt,
        }));
    }

    createByDealer(dto: {
        clientUserId: string;
        userDeviceId: string;
        dealerId: string;
        expiresAt: string;
        serialNumber: string;
        purchaseReceiptUrl?: string;
        description?: string;
    }): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.createByDealer({
            clientUserId: dto.clientUserId,
            userDeviceId: dto.userDeviceId,
            dealerId: dto.dealerId,
            expiresAt: dto.expiresAt,
            serialNumber: dto.serialNumber,
            purchaseReceiptUrl: dto.purchaseReceiptUrl ?? '',
            description: dto.description ?? '',
        }));
    }

    selfCreate(userId: string, dto: {
        userDeviceId: string;
        expiresAt: string;
        description?: string;
    }): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.selfCreate({
            userId,
            userDeviceId: dto.userDeviceId,
            expiresAt: dto.expiresAt,
            description: dto.description ?? '',
        }));
    }

    // ─── Status changes ────────────────────────────────────────────────────

    markPaid(id: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.markPaid({ id }));
    }

    revokeCertificate(id: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.revokeCertificate({ id }));
    }

    reassignCertificate(userId: string, certId: string, userDeviceId: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.reassignCertificate({ userId, certId, userDeviceId }));
    }

    reapplyCertificate(userId: string, sourceCertId: string, dto: {
        durationMonths: number;
        description?: string;
    }): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.reapplyCertificate({
            userId,
            sourceCertId,
            durationMonths: dto.durationMonths,
            description: dto.description ?? '',
        }));
    }

    dismissExpiryReminder(userId: string, certId: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.dismissExpiryReminder({ userId, certId }));
    }

    // ─── Price ─────────────────────────────────────────────────────────────

    calculatePrice(userDeviceId: string, expiresAt: string): Promise<CertPriceResponse> {
        return grpcCall(this.certificateService.calculatePrice({ userDeviceId, expiresAt }));
    }

    // ─── Queries ───────────────────────────────────────────────────────────

    findById(id: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.findById({ id }));
    }

    findByUser(userId: string): Promise<CertificateListResponse> {
        return grpcCall(this.certificateService.findByUser({ userId }));
    }

    findByDealer(dealerId: string, pagination: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }, status?: string): Promise<PaginatedCertificatesResponse> {
        return grpcCall(this.certificateService.findByDealer({
            dealerId,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            status: status ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    findAll(pagination: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<PaginatedCertificatesResponse> {
        return grpcCall(this.certificateService.findAll({
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            status: pagination.status ?? '',
            sortBy: pagination.sortBy ?? '',
            sortOrder: pagination.sortOrder ?? '',
        }));
    }

    validateCertificate(certificateNumber: string): Promise<CertValidateResponse> {
        return grpcCall(this.certificateService.validateCertificate({ certificateNumber }));
    }

    verifySignature(entityType: string, entityId: string): Promise<VerifySignatureResponse> {
        return grpcCall(this.certificateService.verifySignature({ entityType, entityId }));
    }

    getPublicKey(): Promise<PublicKeyResponse> {
        return grpcCall(this.certificateService.getPublicKey({}));
    }
}
