import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, SQL } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle';
import {
  comments,
  tickets,
  ticketEvents,
  ticketStatusEnum,
  NewComment,
  NewTicket,
  NewTicketEvent,
} from '../db/schema';

export interface TicketFilters {
  status?: (typeof ticketStatusEnum.enumValues)[number];
  assignedToId?: number;
}

@Injectable()
export class TicketsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: NewTicket) {
    const [ticket] = await this.db.insert(tickets).values(data).returning();
    return ticket;
  }

  findAll(filters: TicketFilters = {}) {
    const where: SQL[] = [];
    if (filters.status) where.push(eq(tickets.status, filters.status));
    if (filters.assignedToId) where.push(eq(tickets.assignedToId, filters.assignedToId));

    return this.db.query.tickets.findMany({
      where: where.length ? and(...where) : undefined,
      with: { createdBy: true, assignedTo: true },
      orderBy: desc(tickets.createdAt),
    });
  }

  findById(id: number) {
    return this.db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: {
        createdBy: true,
        assignedTo: true,
        comments: {
          with: { author: true },
          orderBy: (c, { asc }) => asc(c.createdAt),
        },
        events: {
          with: { actor: true },
          orderBy: (e, { asc }) => asc(e.createdAt),
        },
      },
    });
  }

  async update(id: number, data: Partial<NewTicket>) {
    const [ticket] = await this.db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket ?? null;
  }

  /** Apply the same patch to many tickets in one statement. Returns the affected IDs. */
  async updateMany(ids: number[], data: Partial<NewTicket>): Promise<number[]> {
    if (ids.length === 0) return [];
    const updated = await this.db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(inArray(tickets.id, ids))
      .returning({ id: tickets.id });
    return updated.map((t) => t.id);
  }

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db.delete(tickets).where(eq(tickets.id, id)).returning();
    return Boolean(deleted);
  }

  async deleteMany(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const deleted = await this.db
      .delete(tickets)
      .where(inArray(tickets.id, ids))
      .returning({ id: tickets.id });
    return deleted.map((t) => t.id);
  }

  /** Only the IDs that actually exist — used to validate a bulk request. */
  async existingIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ id: tickets.id })
      .from(tickets)
      .where(inArray(tickets.id, ids));
    return rows.map((r) => r.id);
  }

  async addComment(data: NewComment) {
    const [comment] = await this.db.insert(comments).values(data).returning();
    return comment;
  }

  async addEvents(events: NewTicketEvent[]) {
    if (events.length === 0) return;
    await this.db.insert(ticketEvents).values(events);
  }
}
