import { Injectable } from '@nestjs/common';
import { SupplierProvider } from './supplier-provider.interface';
import { DummySupplierProvider } from './dummy-supplier.provider';

@Injectable()
export class SupplierService {
    private readonly providers: Map<string, SupplierProvider>;
    private readonly defaultProviderName = 'dummy';

    constructor(dummySupplier: DummySupplierProvider) {
        this.providers = new Map<string, SupplierProvider>([
            ['dummy', dummySupplier],
        ]);
    }

    getProvider(name?: string): SupplierProvider {
        const key = name ?? this.defaultProviderName;
        const provider = this.providers.get(key);
        if (!provider) {
            throw new Error(`Supplier provider "${key}" is not configured`);
        }
        return provider;
    }
}
