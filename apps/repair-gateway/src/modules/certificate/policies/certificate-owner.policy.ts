import { Injectable } from '@nestjs/common';
import { AppErrors, msg } from '@asko/shared';
import { isStaff, type Policy, type PolicyContext } from '@asko/authorization';
import { CertificateClientService } from 'modules/repair-client/certificate-client.service';

/**
 * Assert the user is the certificate owner or staff (admin/manager).
 */
@Injectable()
export class CertificateOwnerPolicy implements Policy {
    constructor(
        private readonly certificateClient: CertificateClientService,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        if (isStaff(ctx.user)) return true;

        const { certificate } = await this.certificateClient.findById(ctx.params.id);
        if (certificate?.userId === ctx.user.sub) return true;

        throw AppErrors.forbidden({ key: msg.access.noAccessToRequest });
    }
}
