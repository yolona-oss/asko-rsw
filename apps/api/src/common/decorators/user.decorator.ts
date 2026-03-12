import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUSET_USER_KEY } from '@asko/shared';
import { JwtPayload } from '@asko/shared';

export const JwtAuthUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return <JwtPayload>request[REQUSET_USER_KEY];
    },
);
