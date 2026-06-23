import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, SQL } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../db/drizzle';
import { comments, tickets, ticketStatusEnum, NewComment, NewTicket } from '../db/schema';

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

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db.delete(tickets).where(eq(tickets.id, id)).returning();
    return Boolean(deleted);
  }

  async addComment(data: NewComment) {
    const [comment] = await this.db.insert(comments).values(data).returning();
    return comment;
  }
}
