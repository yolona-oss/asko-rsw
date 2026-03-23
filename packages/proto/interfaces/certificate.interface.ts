import { Observable } from 'rxjs';

// ─── Records ────────────────────────────────────────────────────────────

export interface CertificateRecord {
    id: string;
    userId: string;
    userDeviceId: string;
    dealerId: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    price: number;
    paid: boolean;
    purchaseReceiptUrl: string;
    description: string;
    createdAt: string;
}

// ─── Requests ───────────────────────────────────────────────────────────

export interface CertAddCertificateRequest {
    userId: string;
    userDeviceId: string;
    certificateNumber: string;
    expiresAt: string;
}

export interface CertCreateByDealerRequest {
    clientUserId: string;
    userDeviceId: string;
    dealerId: string;
    expiresAt: string;
    purchaseReceiptUrl: string;
    description: string;
    serialNumber: string;
}

export interface CertMarkPaidRequest {
    id: string;
}

export interface CertRevokeRequest {
    id: string;
}

export interface CertReassignRequest {
    userId: string;
    certId: string;
    userDeviceId: string;
}

export interface CertCalculatePriceRequest {
    userDeviceId: string;
    expiresAt: string;
}

export interface CertFindByIdRequest {
    id: string;
}

export interface CertFindByUserRequest {
    userId: string;
}

export interface CertFindByDealerRequest {
    dealerId: string;
    offset: number;
    limit: number;
    search: string;
    status: string;
}

export interface CertFindAllRequest {
    offset: number;
    limit: number;
    search: string;
}

export interface CertValidateRequest {
    certificateNumber: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface CertificateResponse {
    certificate: CertificateRecord;
}

export interface CertificateListResponse {
    certificates: CertificateRecord[];
}

export interface PaginatedCertificatesResponse {
    data: CertificateRecord[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface CertPriceResponse {
    price: number;
}

export interface CertValidateResponse {
    valid: boolean;
    certificate: CertificateRecord;
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface CertificateServiceClient {
    addCertificate(request: CertAddCertificateRequest): Observable<CertificateResponse>;
    createByDealer(request: CertCreateByDealerRequest): Observable<CertificateResponse>;
    markPaid(request: CertMarkPaidRequest): Observable<CertificateResponse>;
    revokeCertificate(request: CertRevokeRequest): Observable<CertificateResponse>;
    reassignCertificate(request: CertReassignRequest): Observable<CertificateResponse>;
    calculatePrice(request: CertCalculatePriceRequest): Observable<CertPriceResponse>;
    findById(request: CertFindByIdRequest): Observable<CertificateResponse>;
    findByUser(request: CertFindByUserRequest): Observable<CertificateListResponse>;
    findByDealer(request: CertFindByDealerRequest): Observable<PaginatedCertificatesResponse>;
    findAll(request: CertFindAllRequest): Observable<PaginatedCertificatesResponse>;
    validateCertificate(request: CertValidateRequest): Observable<CertValidateResponse>;
}
