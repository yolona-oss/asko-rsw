import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Repairer, User } from 'entities';
import { RepairerService } from './services/repairer.service';
import { RepairerController } from './controllers/repairer.controller';
import { RepairModule } from '../repair/repair.module';

@Module({
    imports: [MikroOrmModule.forFeature([Repairer, User]), RepairModule],
    controllers: [RepairerController],
    providers: [RepairerService],
    exports: [RepairerService],
})
export class RepairerModule {}
