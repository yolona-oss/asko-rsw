import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY, JwtPayload } from '@asko/shared';

export const JwtAuthUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return <JwtPayload>request[REQUEST_USER_KEY];
    },
);
