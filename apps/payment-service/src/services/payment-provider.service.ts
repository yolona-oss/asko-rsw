import { Injectable } from '@nestjs/common';
import { PaymentProviderType } from '@asko/shared';
import { AppConfig } from '../app.config';
import { PaymentProvider } from 'providers/payment-provider.interface';
import { DummyProvider } from 'providers/dummy.provider';
import { YookassaProvider } from 'providers/yookassa.provider';
import { TbankProvider } from 'providers/tbank.provider';
import { CashProvider } from 'providers/cash.provider';

@Injectable()
export class PaymentProviderService {
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
        this.providers = new Map<string, PaymentProvider>([
            [PaymentProviderType.DUMMY, dummyProvider],
            [PaymentProviderType.YOOKASSA, yookassaProvider],
            [PaymentProviderType.TBANK, tbankProvider],
            [PaymentProviderType.CARD, dummyProvider],
            [PaymentProviderType.CASH, cashProvider],
        ]);

        this.defaultProviderType =
            (this.appConfig.payment.defaultProvider as PaymentProviderType) ?? PaymentProviderType.DUMMY;

        this.enabledProviders = [PaymentProviderType.DUMMY];
        if (this.appConfig.payment.yookassa.shopId) {
            this.enabledProviders.push(PaymentProviderType.YOOKASSA);
        }
        if (this.appConfig.payment.tbank.terminal) {
            this.enabledProviders.push(PaymentProviderType.TBANK);
        }
        this.enabledProviders.push(PaymentProviderType.CASH);
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
