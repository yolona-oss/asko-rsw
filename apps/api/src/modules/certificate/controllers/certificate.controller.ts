import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CertificateService } from '../services/certificate.service';
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
} from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';

@Controller('certificates')
export class CertificateController {
    constructor(private readonly certificateService: CertificateService) {}

    /** User adds a certificate they purchased */
    @RequiredRoles(...ALL_ROLES)
    @Post('add')
    async addCertificate(@JwtAuthUser() user: JwtPayload, @Body() dto: AddCertificateDto) {
        return this.certificateService.addCertificate(user.sub, dto);
    }

    /** Dealer creates a certificate for a client */
    @RequiredRoles(Role.DEALER)
    @Post('create')
    async createByDealer(@JwtAuthUser() user: JwtPayload, @Body() dto: CreateCertificateDto) {
        return this.certificateService.createCertificateByDealer(user.sub, dto);
    }

    /** Reassign certificate to different device */
    @RequiredRoles(...ALL_ROLES)
    @Post(':id/reassign')
    async reassign(
        @JwtAuthUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: AssignCertificateDto,
    ) {
        return this.certificateService.reassignCertificate(user.sub, id, dto.userDeviceId);
    }

    /** Admin approves a certificate */
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/approve')
    async approve(@Param('id') id: string) {
        return this.certificateService.approveCertificate(id);
    }

    /** Admin revokes a certificate */
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/revoke')
    async revoke(@Param('id') id: string) {
        return this.certificateService.revokeCertificate(id);
    }

    /** User gets their certificates */
    @RequiredRoles(...ALL_ROLES)
    @Get('my')
    async findMy(@JwtAuthUser() user: JwtPayload) {
        return this.certificateService.findByUser(user.sub);
    }

    /** Dealer gets certificates they created */
    @RequiredRoles(Role.DEALER)
    @Get('dealer')
    async findDealerCerts(
        @JwtAuthUser() user: JwtPayload,
        @Query() pagination: PaginationDto,
        @Query('status') status?: CertificateStatus,
    ) {
        return this.certificateService.findByDealer(user.sub, pagination, status);
    }

    /** Admin: list all certificates */
    @RequiredRoles(...ADMIN_ROLES)
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.certificateService.findAll(pagination);
    }

    /** Admin: list pending certificates */
    @RequiredRoles(...ADMIN_ROLES)
    @Get('pending')
    async findPending(@Query() pagination: PaginationDto) {
        return this.certificateService.findPending(pagination);
    }

    @RequiredRoles(...ALL_ROLES)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.certificateService.findById(id);
    }
}
