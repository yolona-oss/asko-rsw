import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isMsgKey, t, DEFAULT_LOCALE } from '@asko/shared';
import type { Locale } from '@asko/shared';

/**
 * Translates success response `message` fields that are MsgKey strings.
 *
 * Services return `{ message: msg.auth.codeSent }` which is just the
 * raw key string like `'auth.codeSent'`. This interceptor detects it
 * and replaces it with the localised text for `request.lang`.
 */
@Injectable()
export class TranslateInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const lang: Locale = (request as any).lang ?? DEFAULT_LOCALE;

        return next.handle().pipe(
            map(data => {
                if (data && typeof data === 'object' && typeof data.message === 'string') {
                    if (isMsgKey(data.message)) {
                        return { ...data, message: t(data.message, lang) };
                    }
                }
                return data;
            }),
        );
    }
}
