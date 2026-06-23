import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as public — skips the global Cognito auth guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
