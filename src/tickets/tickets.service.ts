import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository, TicketFilters } from './tickets.repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { NewTicket } from '../db/schema';

@Injectable()
export class TicketsService {
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

  async update(id: number, dto: UpdateTicketDto) {
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
    }
    return this.findOne(id);
  }

  async addComment(id: number, userId: number, body: string) {
    await this.findOne(id); // 404s if missing
    await this.ticketsRepository.addComment({ ticketId: id, authorId: userId, body: body.trim() });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const ok = await this.ticketsRepository.delete(id);
    if (!ok) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
