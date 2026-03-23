import { Module } from '@nestjs/common';
import { RepairerClientModule } from 'modules/repairer-client/repairer-client.module';
import { RepairerController } from './controllers/repairer.controller';

@Module({
    imports: [RepairerClientModule],
    controllers: [RepairerController],
    exports: [RepairerClientModule],
})
export class RepairerModule {}
