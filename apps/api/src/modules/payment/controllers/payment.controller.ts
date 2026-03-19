import { Body, Controller, Get, Param, Post, Headers } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, ALL_ROLES, JwtPayload } from '@asko/shared';
import { RequiredRoles } from 'common/decorators/role.decorator';
import { JwtAuthUser } from 'common/decorators/user.decorator';
import { Public } from 'common/decorators/public.decorotor';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @RequiredRoles(...ALL_ROLES)
    @Get('options')
    async getOptions() {
        return this.paymentService.getOptions();
    }

    @RequiredRoles(...ALL_ROLES)
    @Post('create')
    async create(@JwtAuthUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(user.sub, dto);
    }

    @Public()
    @Post('webhook/:provider')
    async webhook(
        @Param('provider') provider: string,
        @Body() body: any,
        @Headers() headers: Record<string, string>,
    ) {
        return this.paymentService.handleWebhook(provider, body, headers);
    }
}
