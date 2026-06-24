import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TicketsRepository, TicketFilters } from './tickets.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { NewTicket } from '../db/schema';

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
    await this.findOne(id); // 404s if missing

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

    if (Object.keys(patch).length > 0) {
      await this.ticketsRepository.update(id, patch);
      this.logger.log(`Ticket #${id} updated by user ${userId} (${Object.keys(patch).join(', ')})`);
      if (patch.status !== undefined) {
        this.logger.log(`Ticket #${id} status changed to "${patch.status}" by user ${userId}`);
      }
      if (patch.assignedToId !== undefined) {
        this.logger.log(
          patch.assignedToId === null
            ? `Ticket #${id} unassigned by user ${userId}`
            : `Ticket #${id} assigned to user ${patch.assignedToId} by user ${userId}`,
        );
      }
    }
    return this.findOne(id);
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
