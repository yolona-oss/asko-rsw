import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { sleep } from '@asko/shared';
import { BrokenPartService } from 'modules/repair-request/services/broken-part.service';
import {
    SupplierProvider,
    SupplierOrderInput,
    SupplierOrderResult,
} from './supplier-provider.interface';

/**
 * Simulated supplier. Mirrors DummyProvider (payment-service):
 *   - latency on orderPart
 *   - schedules an async "shipped" callback a few seconds after ordering
 */
@Injectable()
export class DummySupplierProvider implements SupplierProvider {
    readonly name = 'dummy';

    private readonly logger = new Logger(DummySupplierProvider.name);

    private static readonly ORDER_LATENCY_MIN = 400;
    private static readonly ORDER_LATENCY_MAX = 900;
    private static readonly SHIP_DELAY_MIN = 3000;
    private static readonly SHIP_DELAY_MAX = 6000;

    constructor(
        @Inject(forwardRef(() => BrokenPartService))
        private readonly brokenPartService: BrokenPartService,
    ) {}

    async orderPart(input: SupplierOrderInput): Promise<SupplierOrderResult> {
        await sleep(
            DummySupplierProvider.randomLatency(
                DummySupplierProvider.ORDER_LATENCY_MIN,
                DummySupplierProvider.ORDER_LATENCY_MAX,
            ),
        );

        const externalOrderId = `sup_${uuid()}`;
        this.scheduleShipment(externalOrderId, input.partId);

        return { externalOrderId };
    }

    private scheduleShipment(externalOrderId: string, partId: string): void {
        const delay = DummySupplierProvider.randomLatency(
            DummySupplierProvider.SHIP_DELAY_MIN,
            DummySupplierProvider.SHIP_DELAY_MAX,
        );
        setTimeout(() => {
            this.brokenPartService
                .handleSupplierCallback(partId, { status: 'shipped', externalOrderId })
                .catch((e) => {
                    this.logger.error(
                        `Simulated supplier callback failed for ${externalOrderId}: ${
                            e instanceof Error ? e.message : e
                        }`,
                    );
                });
        }, delay).unref?.();
    }

    private static randomLatency(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min));
    }
}
