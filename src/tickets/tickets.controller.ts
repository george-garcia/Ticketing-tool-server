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
  @ApiOperation({ summary: 'Update a ticket' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ticketsService.remove(id);
    return { deleted: true };
  }
}
