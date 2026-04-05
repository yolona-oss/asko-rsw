import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '@asko/gateway-common';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
    ) { }

    @ApiOkResponse({ description: 'Health check status' })
    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([]);
    }
}
