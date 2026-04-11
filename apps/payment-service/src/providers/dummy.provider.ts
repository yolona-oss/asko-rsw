import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { sleep } from '@asko/shared';
import { PaymentService } from 'services/payment.service';
import {
    PaymentProvider,
    CreateProviderPaymentInput,
    ProviderPaymentResult,
    PayoutResult,
    WebhookResult,
    RefundResult,
} from './payment-provider.interface';

/**
 * Simulated payment provider. Mimics a real external processor:
 *   - network latency on createPayment / createPayout / refund
 *   - createPayment returns { paid: false } and schedules an async webhook
 *     callback that confirms the payment a few seconds later (like a user
 *     completing checkout on a hosted page)
 * Kept separate from tbank/yookassa stubs; intended only for dev/test.
 */
@Injectable()
export class DummyProvider implements PaymentProvider {
    readonly name = 'dummy';

    private readonly logger = new Logger(DummyProvider.name);

    // Latency ranges (ms) chosen to feel realistic without slowing dev flow.
    private static readonly CREATE_LATENCY_MIN = 300;
    private static readonly CREATE_LATENCY_MAX = 900;
    private static readonly WEBHOOK_DELAY_MIN = 2000;
    private static readonly WEBHOOK_DELAY_MAX = 4000;
    private static readonly REFUND_LATENCY_MIN = 400;
    private static readonly REFUND_LATENCY_MAX = 1000;

    constructor(
        // Circular: PaymentService → PaymentProviderService → DummyProvider → PaymentService
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService,
    ) {}

    async createPayment(_input: CreateProviderPaymentInput): Promise<ProviderPaymentResult> {
        await sleep(
            DummyProvider.randomLatency(
                DummyProvider.CREATE_LATENCY_MIN,
                DummyProvider.CREATE_LATENCY_MAX,
            ),
        );

        const externalId = `dummy_${uuid()}`;

        // Fire-and-forget: simulates the provider calling our webhook after
        // the user "completes" payment on the hosted checkout page.
        this.scheduleWebhook(externalId);

        return {
            externalId,
            paid: false,
            redirectUrl: `dummy-checkout://confirm?externalId=${externalId}`,
        };
    }

    async createPayout(_input: CreateProviderPaymentInput): Promise<PayoutResult> {
        await sleep(
            DummyProvider.randomLatency(
                DummyProvider.CREATE_LATENCY_MIN,
                DummyProvider.CREATE_LATENCY_MAX,
            ),
        );
        // Payouts are confirmed server-side — no user-interaction step.
        return { externalId: `dummy_payout_${uuid()}`, paid: true };
    }

    verifyWebhook(_body: any, _headers?: Record<string, string>): boolean {
        return true;
    }

    async handleWebhook(body: any): Promise<WebhookResult> {
        const externalId = typeof body?.externalId === 'string' ? body.externalId : '';
        if (!externalId) {
            return { externalId: '', paid: false, failed: false };
        }
        const event = typeof body?.event === 'string' ? body.event : '';
        return {
            externalId,
            paid: event === 'payment.succeeded',
            failed: event === 'payment.failed',
        };
    }

    async refund(externalId: string): Promise<RefundResult> {
        await sleep(
            DummyProvider.randomLatency(
                DummyProvider.REFUND_LATENCY_MIN,
                DummyProvider.REFUND_LATENCY_MAX,
            ),
        );
        return { success: true, externalId };
    }

    private scheduleWebhook(externalId: string): void {
        const delay = DummyProvider.randomLatency(
            DummyProvider.WEBHOOK_DELAY_MIN,
            DummyProvider.WEBHOOK_DELAY_MAX,
        );
        setTimeout(() => {
            this.paymentService
                .handleWebhook('dummy', { externalId, event: 'payment.succeeded' })
                .catch((e) => {
                    this.logger.error(
                        `Simulated webhook failed for ${externalId}: ${e instanceof Error ? e.message : e}`,
                    );
                });
        }, delay).unref?.();
    }

    private static randomLatency(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min));
    }
}
