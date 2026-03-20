import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { PaymentService } from 'services/payment.service';

@Controller('payment')
export class WebhookController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('webhook/:provider')
    async webhook(
        @Param('provider') provider: string,
        @Body() body: any,
        @Headers() headers: Record<string, string>,
    ) {
        return this.paymentService.handleWebhook(provider, body, headers);
    }
}
