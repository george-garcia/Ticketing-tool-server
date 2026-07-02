import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle';
import { teams, users, NewTeam, Team } from '../db/schema';

export interface TeamWithCount extends Team {
  memberCount: number;
}

@Injectable()
export class TeamsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** All teams with a live member count, alphabetical. */
  async findAll(): Promise<TeamWithCount[]> {
    const rows = await this.db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        memberCount: sql<number>`count(${users.id})::int`,
      })
      .from(teams)
      .leftJoin(users, eq(users.teamId, teams.id))
      .groupBy(teams.id)
      .orderBy(asc(teams.name));
    return rows;
  }

  async findByName(name: string): Promise<Team | null> {
    const [team] = await this.db.select().from(teams).where(eq(teams.name, name));
    return team ?? null;
  }

  async create(data: NewTeam): Promise<Team> {
    const [team] = await this.db.insert(teams).values(data).returning();
    return team;
  }

  async update(id: number, data: Partial<NewTeam>): Promise<Team | null> {
    const [team] = await this.db.update(teams).set(data).where(eq(teams.id, id)).returning();
    return team ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db.delete(teams).where(eq(teams.id, id)).returning();
    return Boolean(deleted);
  }
}
