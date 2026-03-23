import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { CertificateServiceClient, CertValidateResponse, CertificateResponse } from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class CertificateClientService implements OnModuleInit {
    private certificateService!: CertificateServiceClient;

    constructor(@Inject('CERTIFICATE_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.certificateService = this.client.getService<CertificateServiceClient>('CertificateService');
    }

    validateCertificate(certificateNumber: string): Promise<CertValidateResponse> {
        return grpcCall(this.certificateService.validateCertificate({ certificateNumber }));
    }

    findById(id: string): Promise<CertificateResponse> {
        return grpcCall(this.certificateService.findById({ id }));
    }
}
