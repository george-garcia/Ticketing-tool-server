/**
 * Identity claims from a verified token (Cognito ID token or dev token). Authentication only —
 * roles are NOT carried here. Authorization is owned by the app DB (see users.service), so the
 * identity provider only answers "who are you", never "what may you do".
 */
export interface AuthClaims {
  sub: string;
  email: string;
  name?: string;
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
