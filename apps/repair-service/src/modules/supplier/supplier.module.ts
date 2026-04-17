import { forwardRef, Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { DummySupplierProvider } from './dummy-supplier.provider';
import { RepairRequestModule } from 'modules/repair-request/repair-request.module';

@Module({
    imports: [forwardRef(() => RepairRequestModule)],
    providers: [DummySupplierProvider, SupplierService],
    exports: [SupplierService],
})
export class SupplierModule {}
