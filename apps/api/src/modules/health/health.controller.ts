import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from 'common/decorators/public.decorotor';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: MikroOrmHealthIndicator,
    ) { }

    @ApiOkResponse({ description: 'Health check status' })
    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
        ]);
    }
}
