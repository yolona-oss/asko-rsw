import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Document } from './document.entity';
import { DocumentService } from './document.service';

@Module({
    imports: [MikroOrmModule.forFeature([Document])],
    providers: [DocumentService],
    exports: [DocumentService],
})
export class DocumentModule {}
