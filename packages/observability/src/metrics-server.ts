import { createServer } from 'http';
import { MetricsService } from './metrics.service';

export function createMetricsServer(metricsService: MetricsService, port: number): void {
    const server = createServer(async (req, res) => {
        if (req.url === '/metrics' && req.method === 'GET') {
            try {
                const metrics = await metricsService.getMetrics();
                res.writeHead(200, { 'Content-Type': metricsService.getContentType() });
                res.end(metrics);
            } catch {
                res.writeHead(500);
                res.end('Error collecting metrics');
            }
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    server.listen(port, () => {
        console.log(`Metrics server listening on :${port}/metrics`);
    });
}
