import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { DummySupplierProvider } from './dummy-supplier.provider';

@Module({
    providers: [DummySupplierProvider, SupplierService],
    exports: [SupplierService],
})
export class SupplierModule {}
