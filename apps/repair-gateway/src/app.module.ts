import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MetricsModule } from '@asko/observability';
import { JwtGuard, GATEWAY_CONFIG, UserClientModule } from '@asko/gateway-common';

import { AppConfig, AppConfigModule } from './app.config';

import { RepairModule } from 'modules/repair/repair.module';
import { DeviceModule } from 'modules/device/device.module';
import { CertificateModule } from 'modules/certificate/certificate.module';
import { RepairerModule } from 'modules/repairer/repairer.module';
import { DealerModule } from 'modules/dealer/dealer.module';
import { ReviewModule } from 'modules/review/review.module';
import { WScheduleModule } from 'modules/wschedule/wschedule.module';
import { AddressModule } from 'modules/address/address.module';
import { PaymentModule } from 'modules/payment/payment.module';
import { TaskScheduleModule } from 'modules/task-schedule/task.module';
import { HealthModule } from 'modules/health/health.module';

@Module({
    imports: [
        AppConfigModule,
        MetricsModule.register({ serviceName: 'repair-gateway' }),
        JwtModule,

        UserClientModule.registerAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({ userServiceUrl: config.userServiceUrl }),
        }),

        RepairModule,
        DeviceModule,
        CertificateModule,
        RepairerModule,
        DealerModule,
        ReviewModule,
        WScheduleModule,
        AddressModule,
        PaymentModule,
        TaskScheduleModule,
        HealthModule,
    ],
    providers: [
        { provide: GATEWAY_CONFIG, useExisting: AppConfig },
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
    ],
})
export class AppModule { }
