import { Module } from '@nestjs/common';
import { WScheduleController } from './controllers/wschedule.controller';
import { WScheduleService } from './services/wschedule.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WSchedule } from '@entities/wschedule.entity';

@Module({
    imports: [MikroOrmModule.forFeature([WSchedule])],
    controllers: [WScheduleController],
    providers: [WScheduleService],
    exports: [WScheduleService]
})
export class WScheduleModule {}
