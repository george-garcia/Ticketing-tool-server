import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { BulkUpdateDto, BulkDeleteDto } from './dto/bulk-tickets.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a ticket' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tickets (optionally filtered by status/assignee)' })
  findAll(@Query() query: QueryTicketsDto) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one ticket with its comments' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'Update a ticket (agent/admin only)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, userId, dto);
  }

  @Post('bulk')
  @Roles('agent', 'admin')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Apply changes to many tickets at once (agent/admin only)' })
  bulkUpdate(@CurrentUser('id') userId: number, @Body() dto: BulkUpdateDto) {
    return this.ticketsService.bulkUpdate(userId, dto);
  }

  @Post('bulk-delete')
  @Roles('agent', 'admin')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete many tickets at once (agent/admin only)' })
  bulkDelete(@CurrentUser('id') userId: number, @Body() dto: BulkDeleteDto) {
    return this.ticketsService.bulkDelete(userId, dto);
  }

  @Post(':id/comments')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Add a comment to a ticket' })
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: AddCommentDto,
  ) {
    return this.ticketsService.addComment(id, userId, dto.body);
  }

  @Delete(':id')
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'Delete a ticket (agent/admin only)' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    await this.ticketsService.remove(id, userId);
    return { deleted: true };
  }
}
