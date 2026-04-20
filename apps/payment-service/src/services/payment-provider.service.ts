import { Injectable, Logger } from '@nestjs/common';
import { PaymentProviderType } from '@asko/shared';
import { AppConfig } from '../app.config';
import { PaymentProvider } from 'providers/payment-provider.interface';
import { DummyProvider } from 'providers/dummy.provider';
import { YookassaProvider } from 'providers/yookassa.provider';
import { TbankProvider } from 'providers/tbank.provider';
import { CashProvider } from 'providers/cash.provider';

@Injectable()
export class PaymentProviderService {
    private readonly logger = new Logger(PaymentProviderService.name);
    private readonly providers: Map<string, PaymentProvider>;
    private readonly defaultProviderType: PaymentProviderType;
    private readonly enabledProviders: PaymentProviderType[];

    constructor(
        private readonly appConfig: AppConfig,
        dummyProvider: DummyProvider,
        yookassaProvider: YookassaProvider,
        tbankProvider: TbankProvider,
        cashProvider: CashProvider,
    ) {
        this.providers = new Map<string, PaymentProvider>();

        // Dummy — only registered when explicitly enabled (dev/test)
        const dummyEnabled = this.appConfig.payment.enableDummy;
        if (dummyEnabled) {
            this.providers.set(PaymentProviderType.DUMMY, dummyProvider);
        }

        // Real providers — registered when credentials are present
        if (this.appConfig.payment.yookassa.shopId) {
            this.providers.set(PaymentProviderType.YOOKASSA, yookassaProvider);
        }
        if (this.appConfig.payment.tbank.terminal) {
            this.providers.set(PaymentProviderType.TBANK, tbankProvider);
        }

        // CARD resolves to the default real provider (tbank > yookassa > dummy fallback)
        const cardProvider =
            this.providers.get(PaymentProviderType.TBANK) ??
            this.providers.get(PaymentProviderType.YOOKASSA) ??
            (dummyEnabled ? dummyProvider : undefined);
        if (cardProvider) {
            this.providers.set(PaymentProviderType.CARD, cardProvider);
        }

        // Cash is always available
        this.providers.set(PaymentProviderType.CASH, cashProvider);

        // Build enabled list (CARD is an alias, not listed separately)
        this.enabledProviders = [];
        if (dummyEnabled) this.enabledProviders.push(PaymentProviderType.DUMMY);
        if (this.providers.has(PaymentProviderType.YOOKASSA)) this.enabledProviders.push(PaymentProviderType.YOOKASSA);
        if (this.providers.has(PaymentProviderType.TBANK)) this.enabledProviders.push(PaymentProviderType.TBANK);
        this.enabledProviders.push(PaymentProviderType.CARD);
        this.enabledProviders.push(PaymentProviderType.CASH);

        this.defaultProviderType =
            (this.appConfig.payment.defaultProvider as PaymentProviderType) ?? PaymentProviderType.DUMMY;

        if (!this.providers.has(this.defaultProviderType)) {
            this.logger.error(
                `Default provider "${this.defaultProviderType}" is not registered. Available: [${[...this.providers.keys()].join(', ')}]`,
            );
        }

        this.logger.log(
            `Payment providers enabled: [${this.enabledProviders.join(', ')}], default: ${this.defaultProviderType}`,
        );
    }

    getProvider(type: string): PaymentProvider | undefined {
        return this.providers.get(type);
    }

    getDefaultProvider(): PaymentProviderType {
        return this.defaultProviderType;
    }

    getEnabledProviders(): PaymentProviderType[] {
        return this.enabledProviders;
    }

    getOptions() {
        return {
            providers: this.enabledProviders,
            defaultProvider: this.defaultProviderType,
        };
    }
}
