import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/** Injection token for the Drizzle database instance. */
export const DRIZZLE = Symbol('DRIZZLE');

/** Strongly-typed Drizzle DB (includes the relational query API via `schema`). */
export type DrizzleDB = PostgresJsDatabase<typeof schema>;
