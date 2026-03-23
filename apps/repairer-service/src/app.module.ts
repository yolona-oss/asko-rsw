import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { FileClientModule } from 'modules/file-client.module';
import { Repairer } from 'entities/repairer.entity';
import { Review } from 'entities/review.entity';
import { RepairerGrpcController } from 'controllers/repairer.grpc.controller';
import { RepairerService } from 'services/repairer.service';
import { ReviewService } from 'services/review.service';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([Repairer, Review]),
        FileClientModule,
    ],
    controllers: [RepairerGrpcController],
    providers: [RepairerService, ReviewService],
})
export class AppModule {}
