import { Body, Controller, Get, Inject, Param, Post, Query, forwardRef } from '@nestjs/common';
import { CertificateClientService } from 'modules/certificate-client/certificate-client.service';
import { DeviceClientService } from 'modules/device-client/device-client.service';
import { DealerService } from 'modules/dealer/services/dealer.service';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import {
    AddCertificateDto,
    CreateCertificateDto,
    AssignCertificateDto,
    CertificateStatus,
    PaginationDto,
    ALL_ROLES,
    ADMIN_ROLES,
    Role,
    JwtPayload,
    PaymentTargetType,
    PaymentProviderType,
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('certificates')
export class CertificateController {
    constructor(
        private readonly certificateClient: CertificateClientService,
        private readonly deviceClient: DeviceClientService,
        private readonly paymentService: PaymentClientService,
        @Inject(forwardRef(() => DealerService))
        private readonly dealerService: DealerService,
    ) {}

    /** User adds a certificate they purchased */
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
    @RequiredRoles(Role.DEALER)
    @Post('create')
    async createByDealer(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateCertificateDto) {
        // Resolve dealer profile to get dealerId
        const dealerProfile = await this.dealerService.getProfile(user.sub);

        // Create address via device-service
        const addressRes = await this.deviceClient.createAddress({
            country: dto.country,
            city: dto.city,
            street: dto.street,
            house: dto.house,
            building: dto.building,
            floor: dto.floor,
            room: dto.room,
            postalCode: dto.postalCode,
        });

        // Create UserDevice for the client via device-service
        const userDeviceRes = await this.deviceClient.registerUserDevice(dto.clientUserId, {
            deviceId: dto.deviceId,
            serialNumber: dto.serialNumber,
            addressId: addressRes.address.id,
        });

        // Link client to dealer
        try {
            await this.dealerService.addClient(user.sub, { clientUserId: dto.clientUserId });
        } catch {
            // Ignore if already linked
        }

        // Create certificate via certificate-service
        const result = await this.certificateClient.createByDealer({
            clientUserId: dto.clientUserId,
            userDeviceId: userDeviceRes.userDevice.id,
            dealerId: dealerProfile.id,
            expiresAt: dto.expiresAt,
            serialNumber: dto.serialNumber,
            purchaseReceiptUrl: dto.purchaseReceiptUrl,
            description: dto.description,
        });

        return result;
    }

    /** Reassign certificate to different device */
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/reassign')
    async reassign(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: AssignCertificateDto,
    ) {
        return this.certificateClient.reassignCertificate(user.sub, id, dto.userDeviceId);
    }

    /** Admin revokes a certificate */
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/revoke')
    async revoke(@Param('id') id: string) {
        return this.certificateClient.revokeCertificate(id);
    }

    /** Calculate certificate price before purchase */
    @RequiredRoles(...ALL_ROLES)
    @Get('calculate-price')
    async calculatePrice(
        @Query('userDeviceId') userDeviceId: string,
        @Query('expiresAt') expiresAt: string,
    ) {
        return this.certificateClient.calculatePrice(userDeviceId, expiresAt);
    }

    /** User gets their certificates */
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        return this.certificateClient.findByUser(user.sub);
    }

    /** Dealer gets certificates they created */
    @RequiredRoles(Role.DEALER)
    @Get('dealer')
    async findDealerCerts(
        @JwtAuthUser() user: JwtPayload,
        @Query() pagination: PaginationDto,
        @Query('status') status?: CertificateStatus,
    ) {
        // Resolve dealer profile to get dealerId
        const dealerProfile = await this.dealerService.getProfile(user.sub);
        return this.certificateClient.findByDealer(dealerProfile.id, pagination, status);
    }

    /** Admin: list all certificates */
    @RequiredRoles(...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.certificateClient.findAll(pagination);
    }

    /** Pay for a certificate */
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
    @RequiredRoles(...ALL_ROLES)
    @Get(':id/payments')
    async getPayments(@Param('id') id: string) {
        return this.paymentService.getPaymentsByTarget('certificate', id);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.certificateClient.findById(id);
    }
}
