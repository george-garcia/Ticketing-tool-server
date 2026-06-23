import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle';
import { users, NewUser, User } from '../db/schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findByCognitoSub(sub: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.cognitoSub, sub));
    return user ?? null;
  }

  findAll(): Promise<User[]> {
    return this.db.select().from(users).orderBy(asc(users.firstName));
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | null> {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db.delete(users).where(eq(users.id, id)).returning();
    return Boolean(deleted);
  }
}
