import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TicketsRepository, TicketFilters } from './tickets.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { BulkUpdateDto, BulkDeleteDto } from './dto/bulk-tickets.dto';
import { NewTicket, NewTicketEvent } from '../db/schema';

/** A ticket loaded with its `assignedTo` relation, as returned by the repository. */
type LoadedTicket = NonNullable<Awaited<ReturnType<TicketsRepository['findById']>>>;

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async create(userId: number, dto: CreateTicketDto) {
    const { comment, assignedToId, ...rest } = dto;
    const ticket = await this.ticketsRepository.create({
      ...rest,
      assignedToId: assignedToId ?? null,
      createdById: userId,
    });

    // Seed the changelog with the creation marker so every ticket has a first event.
    await this.ticketsRepository.addEvents([
      { ticketId: ticket.id, actorId: userId, field: 'created', toValue: ticket.status },
    ]);

    if (comment?.trim()) {
      await this.ticketsRepository.addComment({
        ticketId: ticket.id,
        authorId: userId,
        body: comment.trim(),
      });
    }
    this.logger.log(`Ticket #${ticket.id} created by user ${userId}`);
    return this.findOne(ticket.id);
  }

  /** Diff two loaded tickets and produce changelog events for the fields that changed. */
  private diffEvents(before: LoadedTicket, after: LoadedTicket, userId: number): NewTicketEvent[] {
    const events: NewTicketEvent[] = [];
    const track = (field: string, from: string | null, to: string | null) => {
      if (from !== to) events.push({ ticketId: after.id, actorId: userId, field, fromValue: from, toValue: to });
    };
    track('status', before.status, after.status);
    track('priority', before.priority, after.priority);
    track('impact', before.impact, after.impact);
    track('category', before.category, after.category);
    const name = (t: LoadedTicket) =>
      t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`.trim() || t.assignedTo.email : 'Unassigned';
    track('assignee', name(before), name(after));
    return events;
  }

  findAll(filters: TicketFilters = {}) {
    return this.ticketsRepository.findAll(filters);
  }

  async findOne(id: number) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async update(id: number, userId: number, dto: UpdateTicketDto) {
    const before = await this.findOne(id); // 404s if missing

    const patch: Partial<NewTicket> = {};
    const fields = [
      'title',
      'description',
      'status',
      'priority',
      'impact',
      'category',
      'contact',
      'product',
    ] as const;
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (patch as Record<string, unknown>)[field] = dto[field];
      }
    }
    // assignedToId may be set to null to unassign — distinguish "absent" from "null".
    if (dto.assignedToId !== undefined) {
      patch.assignedToId = dto.assignedToId;
    }

    if (Object.keys(patch).length === 0) {
      return before;
    }

    await this.ticketsRepository.update(id, patch);
    const after = await this.findOne(id);

    // Record the changelog for the fields that actually changed.
    const events = this.diffEvents(before, after, userId);
    await this.ticketsRepository.addEvents(events);

    this.logger.log(
      `Ticket #${id} updated by user ${userId} (${events.map((e) => e.field).join(', ') || 'no tracked change'})`,
    );
    return after;
  }

  /** Apply the same change to many tickets (reassign / set status / etc.), recording events per ticket. */
  async bulkUpdate(userId: number, dto: BulkUpdateDto): Promise<{ updated: number }> {
    const ids = await this.ticketsRepository.existingIds(dto.ids);
    for (const id of ids) {
      await this.update(id, userId, dto.changes);
    }
    this.logger.log(`Bulk update by user ${userId}: ${ids.length}/${dto.ids.length} tickets`);
    return { updated: ids.length };
  }

  async bulkDelete(userId: number, dto: BulkDeleteDto): Promise<{ deleted: number }> {
    const deleted = await this.ticketsRepository.deleteMany(dto.ids);
    this.logger.log(`Bulk delete by user ${userId}: ${deleted.length}/${dto.ids.length} tickets`);
    return { deleted: deleted.length };
  }

  async addComment(id: number, userId: number, body: string) {
    await this.findOne(id); // 404s if missing
    await this.ticketsRepository.addComment({ ticketId: id, authorId: userId, body: body.trim() });
    this.logger.log(`Comment added to ticket #${id} by user ${userId}`);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const ok = await this.ticketsRepository.delete(id);
    if (!ok) {
      throw new NotFoundException('Ticket not found');
    }
    this.logger.log(`Ticket #${id} deleted by user ${userId}`);
  }
}
