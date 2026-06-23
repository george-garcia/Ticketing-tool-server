import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CognitoVerifierService } from './cognito-verifier.service';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Global guard: verifies the bearer token, just-in-time provisions the local user
 * profile (keyed by Cognito `sub`), and attaches the resolved user to the request.
 */
@Injectable()
export class CognitoAuthGuard implements CanActivate {
  constructor(
    private readonly verifier: CognitoVerifierService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const token = header.slice('Bearer '.length).trim();

    let claims;
    try {
      claims = await this.verifier.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findOrCreateFromClaims(claims);
    (request as Request & { user: unknown }).user = {
      id: user.id,
      sub: user.cognitoSub,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      role: user.role,
    };
    return true;
  }
}
