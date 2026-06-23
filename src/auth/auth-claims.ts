/** Identity claims extracted from a verified token (Cognito ID token or dev token). */
export interface AuthClaims {
  sub: string;
  email: string;
  name?: string;
  roles: string[];
}

export type AppRole = 'user' | 'agent' | 'admin';

/** The authenticated user attached to each request after the auth guard runs. */
export interface AuthUser {
  id: number;
  sub: string;
  email: string;
  name: string;
  role: AppRole;
}
