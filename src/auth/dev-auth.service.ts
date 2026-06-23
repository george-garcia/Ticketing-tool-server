import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { DevLoginDto } from './dto/dev-login.dto';

/**
 * Issues locally-signed HS256 tokens — ONLY when AUTH_MODE=dev. This lets the
 * client run end-to-end without AWS Cognito. In production (AUTH_MODE=cognito)
 * every call here is rejected.
 */
@Injectable()
export class DevAuthService {
  private readonly authMode: string;
  private readonly devSecret: string;

  constructor(config: ConfigService) {
    this.authMode = config.get<string>('AUTH_MODE', 'cognito');
    this.devSecret = config.get<string>('DEV_AUTH_SECRET', '');
  }

  issue(input: DevLoginDto): string {
    if (this.authMode !== 'dev') {
      throw new ForbiddenException('Dev login is disabled');
    }
    if (!this.devSecret) {
      throw new Error('DEV_AUTH_SECRET is not set');
    }
    const name =
      [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || input.email;

    return jwt.sign(
      { sub: `dev-${input.email}`, email: input.email, name, 'cognito:groups': input.groups ?? [] },
      this.devSecret,
      { expiresIn: '12h' },
    );
  }
}
