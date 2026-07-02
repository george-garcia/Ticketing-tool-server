import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle';
import { appSettings, AppSettings } from '../db/schema';

const SINGLETON_ID = 1;

@Injectable()
export class SettingsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async get(): Promise<AppSettings | null> {
    const [row] = await this.db.select().from(appSettings).where(eq(appSettings.id, SINGLETON_ID));
    return row ?? null;
  }

  /** Insert-or-update the single settings row. Unset fields fall back to column defaults. */
  async upsert(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings> {
    const [row] = await this.db
      .insert(appSettings)
      .values({ id: SINGLETON_ID, ...data })
      .onConflictDoUpdate({ target: appSettings.id, set: { ...data, updatedAt: new Date() } })
      .returning();
    return row;
  }
}
