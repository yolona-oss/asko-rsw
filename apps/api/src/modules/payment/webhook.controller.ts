import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { PaymentClientService } from 'modules/payment-client/payment-client.service';
import { Public } from '@asko/gateway-common';

@ApiTags('Webhooks')
@Controller('webhook')
export class WebhookController {
    constructor(private readonly paymentService: PaymentClientService) {}

    @Public()
    @ApiOkResponse({ description: 'Webhook acknowledged' })
    @Post('payment/:provider')
    async handlePaymentWebhook(
        @Param('provider') provider: string,
        @Body() body: any,
        @Headers() headers: Record<string, string>,
    ) {
        return this.paymentService.handleWebhook(provider, body, headers);
    }
}
