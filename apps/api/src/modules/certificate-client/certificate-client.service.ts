import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    CertificateServiceClient,
    CertificateResponse,
    CertificateListResponse,
    PaginatedCertificatesResponse,
    CertPriceResponse,
    CertValidateResponse,
} from '@asko/proto';

@Injectable()
export class CertificateClientService implements OnModuleInit {
    private certificateService!: CertificateServiceClient;

    constructor(
        @Inject('CERTIFICATE_PACKAGE') private readonly client: ClientGrpc,
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
        offset?: number;
        limit?: number;
        search?: string;
    }, status?: string): Promise<PaginatedCertificatesResponse> {
        return grpcCall(this.certificateService.findByDealer({
            dealerId,
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
            status: status ?? '',
        }));
    }

    findAll(pagination: {
        offset?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedCertificatesResponse> {
        return grpcCall(this.certificateService.findAll({
            offset: pagination.offset ?? 0,
            limit: pagination.limit ?? 20,
            search: pagination.search ?? '',
        }));
    }

    validateCertificate(certificateNumber: string): Promise<CertValidateResponse> {
        return grpcCall(this.certificateService.validateCertificate({ certificateNumber }));
    }
}
