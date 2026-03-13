import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from 'common/decorators/public.decorotor';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: MikroOrmHealthIndicator,
    ) { }

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
        ]);
    }
}
