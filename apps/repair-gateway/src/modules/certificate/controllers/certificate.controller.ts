import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CertificateClientService } from 'modules/repair-client/certificate-client.service';
import { DeviceClientService } from 'modules/repair-client/device-client.service';
import { DealerClientService } from 'modules/repair-client/dealer-client.service';
import { RepairFileClientService } from 'modules/repair/services/repair-file-client.service';
import { UserClientService } from '@asko/gateway-common';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { IsOptional, IsEnum } from 'class-validator';
import {
    AddCertificateDto,
    CreateCertificateDto,
    SelfCreateCertificateDto,
    AssignCertificateDto,
    ReapplyCertificateDto,
    CertificateStatus,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    PaymentTargetType,
    PaymentProviderType,
    ImageTypeEnum,
    computeExpiresAt,
} from '@asko/shared';

import { RequiredRoles, JwtAuthUser, Public } from '@asko/gateway-common';

class FindDealerCertificatesDto extends PaginationDto {
    @IsOptional()
    @IsEnum(CertificateStatus)
    status?: CertificateStatus;
}

import {
    CertificateResponseDto,
    CertPriceResponseDto,
    CertificateListResponseDto,
    PaginatedCertificatesResponseDto,
    VerifySignatureResponseDto,
    PublicKeyResponseDto,
} from '../dto/certificate.response.dto';
import { ProcessInvoiceResponseDto, PaymentListResponseDto } from 'modules/payment/dto/payment.response.dto';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificateController {
    constructor(
        private readonly certificateClient: CertificateClientService,
        private readonly deviceClient: DeviceClientService,
        private readonly userClient: UserClientService,
        private readonly paymentService: PaymentClientService,
        private readonly dealerClient: DealerClientService,
        private readonly fileService: RepairFileClientService,
    ) {}

    private async enrichCertificates(certs: any[]): Promise<void> {
        const enrichments: Promise<void>[] = [];
        for (const cert of certs) {
            // Enrich certificate owner
            if (cert.userId) {
                enrichments.push(
                    this.userClient.findUserById({ id: cert.userId })
                        .then((u) => { if (u) cert.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                        .catch(() => {}),
                );
            }
            // Enrich dealer user
            if (cert.dealer?.userId) {
                enrichments.push(
                    this.userClient.findUserById({ id: cert.dealer.userId })
                        .then((u) => { if (u) cert.dealer.user = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone }; })
                        .catch(() => {}),
                );
            }
        }
        await Promise.all(enrichments);
    }

    /** User adds a certificate they purchased */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post('add')
    async addCertificate(@JwtAuthUser() user: JwtPayload, @Body() dto: AddCertificateDto) {
        return this.certificateClient.addCertificate(user.sub, {
            userDeviceId: dto.userDeviceId,
            certificateNumber: dto.certificateNumber,
            expiresAt: dto.expiresAt,
        });
    }

    /** Dealer creates a certificate for a client */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(Role.DEALER)
    @Post('create')
    async createByDealer(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateCertificateDto) {
        // Resolve dealer profile to get dealerId
        const { profile: dealerProfile } = await this.dealerClient.getProfile(user.sub);

        // Create address via device-service
        const addressRes = await this.deviceClient.createAddress(dto.clientUserId, {
            city: dto.city,
            street: dto.street,
            house: dto.house,
            building: dto.building,
            apartment: dto.apartment,
            entrance: dto.entrance,
            floor: dto.floor,
            intercom: dto.intercom,
        });

        // Create UserDevice for the client via device-service
        const userDeviceRes = await this.deviceClient.registerUserDevice(dto.clientUserId, {
            deviceId: dto.deviceId,
            serialNumber: dto.serialNumber,
            addressId: addressRes.address.id,
        });

        // Link client to dealer
        try {
            await this.dealerClient.addClient(user.sub, dto.clientUserId);
        } catch {
            // Ignore if already linked
        }

        // Compute expiration date from duration, rounded to end of day
        const expiresAt = computeExpiresAt(dto.durationMonths).toISOString();

        // Create certificate via certificate-service
        const result = await this.certificateClient.createByDealer({
            clientUserId: dto.clientUserId,
            userDeviceId: userDeviceRes.userDevice.id,
            dealerId: dealerProfile.id,
            expiresAt,
            serialNumber: dto.serialNumber,
            purchaseReceiptUrl: dto.purchaseReceiptUrl,
            description: dto.description,
        });

        return result;
    }

    /** User self-creates a certificate for one of their devices (PENDING_PAYMENT + invoice) */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post('self-create')
    async selfCreate(@JwtAuthUser() user: JwtPayload, @Body() dto: SelfCreateCertificateDto) {
        const expiresAt = computeExpiresAt(dto.durationMonths).toISOString();
        return this.certificateClient.selfCreate(user.sub, {
            userDeviceId: dto.userDeviceId,
            expiresAt,
            description: dto.description,
        });
    }

    /** Reassign certificate to different device */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/reassign')
    async reassign(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: AssignCertificateDto,
    ) {
        return this.certificateClient.reassignCertificate(user.sub, id, dto.userDeviceId);
    }

    /** User reapplies (renews) an expired / near-expiry certificate */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/reapply')
    async reapply(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ReapplyCertificateDto,
    ) {
        return this.certificateClient.reapplyCertificate(user.sub, id, {
            durationMonths: dto.durationMonths,
            description: dto.description,
        });
    }

    /** User dismisses the "expiring soon" reminder for a certificate */
    @ApiOkResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/dismiss-reminder')
    async dismissReminder(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
    ) {
        return this.certificateClient.dismissExpiryReminder(user.sub, id);
    }

    /** Admin revokes a certificate */
    @ApiCreatedResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/revoke')
    async revoke(@Param('id') id: string) {
        return this.certificateClient.revokeCertificate(id);
    }

    /** Calculate certificate price before purchase */
    @ApiOkResponse({ type: CertPriceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('calculate-price')
    async calculatePrice(
        @Query('userDeviceId') userDeviceId: string,
        @Query('durationMonths') durationMonths: string,
    ) {
        const expiresAt = computeExpiresAt(Number(durationMonths)).toISOString();
        return this.certificateClient.calculatePrice(userDeviceId, expiresAt);
    }

    /** User gets their certificates */
    @ApiOkResponse({ type: CertificateListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        const result = await this.certificateClient.findByUser(user.sub);
        await this.enrichCertificates(result.certificates ?? []);
        return result;
    }

    /** Dealer gets certificates they created */
    @ApiOkResponse({ type: PaginatedCertificatesResponseDto })
    @RequiredRoles(Role.DEALER)
    @Get('dealer')
    async findDealerCerts(
        @JwtAuthUser() user: JwtPayload,
        @Query() query: FindDealerCertificatesDto,
    ) {
        const { status, ...pagination } = query;
        // Resolve dealer profile to get dealerId
        const { profile: dealerProfile } = await this.dealerClient.getProfile(user.sub);
        const result = await this.certificateClient.findByDealer(dealerProfile.id, pagination, status);
        result.data = result.data ?? [];
        await this.enrichCertificates(result.data);
        return result;
    }

    /** Admin: list all certificates */
    @ApiOkResponse({ type: PaginatedCertificatesResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Get()
    async findAll(@Query() query: FindDealerCertificatesDto) {
        const result = await this.certificateClient.findAll(query);
        result.data = result.data ?? [];
        await this.enrichCertificates(result.data);
        return result;
    }

    /** Pay for a certificate */
    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/pay')
    async pay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.paymentService.processInvoice(
            user.sub,
            PaymentTargetType.CERTIFICATE,
            id,
        );
    }

    /** Dummy pay for a certificate (testing) */
    @ApiCreatedResponse({ type: ProcessInvoiceResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/dummy-pay')
    async dummyPay(@JwtAuthUser() user: JwtPayload, @Param('id') id: string) {
        return this.paymentService.processInvoice(
            user.sub,
            PaymentTargetType.CERTIFICATE,
            id,
            PaymentProviderType.DUMMY,
        );
    }

    /** Get payments for a certificate */
    @ApiOkResponse({ type: PaymentListResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/payments')
    async getPayments(@Param('id') id: string) {
        return this.paymentService.getPaymentsByTarget('certificate', id);
    }

    @ApiOkResponse({ type: PublicKeyResponseDto })
    @Public()
    @Get('public-key')
    async getPublicKey() {
        return this.certificateClient.getPublicKey();
    }

    @ApiOkResponse({ type: VerifySignatureResponseDto })
    @Public()
    @Get('verify/:id')
    async verifySignature(@Param('id') id: string) {
        return this.certificateClient.verifySignature('certificate', id);
    }

    // ── PDF Generation ──

    @ApiCreatedResponse()
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/pdf/generate')
    async generatePdf(
        @JwtAuthUser() _user: JwtPayload,
        @Param('id') id: string,
        @Query('force') force?: string,
    ) {
        // 1. Fetch certificate
        const certData = await this.certificateClient.findById(id);
        const cert = certData.certificate;

        // 2. Check cache
        if (cert.pdfDocumentId && force !== 'true') {
            return { documentId: cert.pdfDocumentId };
        }

        // 3. Resolve device info
        const device = (cert as any).userDevice?.device;
        const deviceCatalogId = device?.id ?? '';

        // 4. Fetch device image bytes
        let deviceImage: Uint8Array | undefined;
        let deviceImageMimetype: string | undefined;
        if (deviceCatalogId) {
            try {
                const { images } = await this.fileService.findAttachedImages(
                    ImageTypeEnum.Device, deviceCatalogId,
                );
                if (images.length > 0) {
                    const sorted = [...images].sort((a, b) => a.order - b.order);
                    const imageJson = sorted[0].imageJson;
                    const url = imageJson?.original?.secure_url
                        || imageJson?.medium?.secure_url
                        || imageJson?.thumbnail?.secure_url;
                    if (url) {
                        const bytes = await this.fetchImageBytes(url);
                        if (bytes) {
                            deviceImage = bytes;
                            deviceImageMimetype = url.includes('.png') ? 'image/png' : 'image/jpeg';
                        }
                    }
                }
            } catch { /* proceed without image */ }
        }

        // 5. Generate PDF via repair-service
        const result = await this.certificateClient.generateCertificatePdf(id, {
            deviceName: device?.name ?? 'Устройство',
            deviceBrand: device?.brand ?? '',
            deviceModel: device?.model ?? '',
            deviceDescription: device?.description ?? '',
            deviceImage,
            deviceImageMimetype,
        });

        // 6. Upload PDF to file-service
        const filename = `cert-${cert.certificateNumber}.pdf`;
        const docResult = await this.fileService.uploadDocumentBuffer(
            Buffer.from(result.pdfBuffer),
            filename,
            'certificate',
            id,
            cert.userId,
        );

        // 7. Store document ID on certificate
        await this.certificateClient.setPdfDocumentId(id, docResult.document!.id);

        return { documentId: docResult.document!.id };
    }

    private async fetchImageBytes(url: string): Promise<Uint8Array | undefined> {
        if (!url) return undefined;

        // Local storage URL (contains /images/) — read from shared filesystem
        const isLocal = url.includes('/images/');
        if (isLocal) {
            try {
                const fs = await import('fs/promises');
                const path = await import('path');
                const staticPath = process.env.STATIC_PATH || 'images';
                const relativePath = url.split('/images/').pop() || '';
                if (!relativePath) return undefined;
                const filePath = path.join(process.cwd(), staticPath, relativePath);
                return await fs.readFile(filePath);
            } catch { return undefined; }
        }

        // Remote URL (Cloudinary, etc.) — fetch via HTTP
        if (url.startsWith('http')) {
            try {
                const res = await fetch(url);
                if (!res.ok) return undefined;
                return new Uint8Array(await res.arrayBuffer());
            } catch { return undefined; }
        }

        return undefined;
    }

    @ApiOkResponse({ type: CertificateResponseDto })
    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const cert = await this.certificateClient.findById(id);
        await this.enrichCertificates([cert]);
        return cert;
    }
}
