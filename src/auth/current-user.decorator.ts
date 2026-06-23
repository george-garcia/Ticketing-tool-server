import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './auth-claims';

/** Injects the authenticated user (or one of its fields) into a controller handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    return data ? user?.[data] : user;
  },
);
