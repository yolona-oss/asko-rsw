import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { parseAcceptLanguage } from '@asko/shared';

/**
 * Parses the `Accept-Language` header and attaches `request.lang` (Locale)
 * so downstream filters/interceptors can translate responses.
 */
@Injectable()
export class LangMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void {
        (req as any).lang = parseAcceptLanguage(req.headers['accept-language']);
        next();
    }
}
