import { Module } from '@nestjs/common';
import { RepairClientModule } from 'modules/repair-client/repair-client.module';
import { UserClientModule } from '@asko/gateway-common';
import { AppConfig } from 'app.config';
import { RepairerController } from './controllers/repairer.controller';

@Module({
    imports: [
        RepairClientModule,
        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),
    ],
    controllers: [RepairerController],
    exports: [RepairClientModule],
})
export class RepairerModule {}
