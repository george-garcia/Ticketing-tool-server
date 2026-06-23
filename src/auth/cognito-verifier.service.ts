import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import * as jwt from 'jsonwebtoken';
import { AuthClaims } from './auth-claims';

/**
 * Verifies bearer tokens and normalizes them into {@link AuthClaims}.
 *
 * - AUTH_MODE=cognito: verifies Cognito ID tokens against the User Pool's JWKS.
 * - AUTH_MODE=dev:     verifies locally-signed HS256 tokens (DEV_AUTH_SECRET) so the
 *   API can run and be tested without any AWS dependency.
 */
@Injectable()
export class CognitoVerifierService {
  private readonly logger = new Logger(CognitoVerifierService.name);
  private readonly authMode: string;
  private readonly devSecret: string;
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create> | null;

  constructor(private readonly config: ConfigService) {
    this.authMode = this.config.get<string>('AUTH_MODE', 'cognito');
    this.devSecret = this.config.get<string>('DEV_AUTH_SECRET', '');

    if (this.authMode === 'cognito') {
      this.verifier = CognitoJwtVerifier.create({
        userPoolId: this.config.getOrThrow<string>('COGNITO_USER_POOL_ID'),
        clientId: this.config.getOrThrow<string>('COGNITO_CLIENT_ID'),
        tokenUse: 'id',
      });
    } else {
      this.verifier = null;
      this.logger.warn(
        `AUTH_MODE=${this.authMode}: verifying locally-signed dev tokens. Do NOT use in production.`,
      );
    }
  }

  async verify(token: string): Promise<AuthClaims> {
    if (this.verifier) {
      const payload = await this.verifier.verify(token);
      const p = payload as Record<string, unknown>;
      const given = p.given_name ? String(p.given_name) : '';
      const family = p.family_name ? String(p.family_name) : '';
      const fullName = p.name ? String(p.name) : `${given} ${family}`.trim();
      return {
        sub: payload.sub,
        email: String(payload.email ?? ''),
        name: fullName || undefined,
        roles: (p['cognito:groups'] as string[] | undefined) ?? [],
      };
    }

    if (!this.devSecret) {
      throw new Error('DEV_AUTH_SECRET is not set');
    }
    const payload = jwt.verify(token, this.devSecret) as jwt.JwtPayload;
    return {
      sub: String(payload.sub ?? ''),
      email: String(payload.email ?? ''),
      name: payload.name ? String(payload.name) : undefined,
      roles:
        (payload['cognito:groups'] as string[] | undefined) ??
        (payload.roles as string[] | undefined) ??
        [],
    };
  }
}
