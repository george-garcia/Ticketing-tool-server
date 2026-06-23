import { SetMetadata } from '@nestjs/common';
import { AppRole } from './auth-claims';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given role(s). Enforced by the global RolesGuard. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
