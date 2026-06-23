import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TICKET_STATUS } from './create-ticket.dto';

export class QueryTicketsDto {
  @ApiPropertyOptional({ enum: TICKET_STATUS })
  @IsOptional()
  @IsEnum(TICKET_STATUS)
  status?: (typeof TICKET_STATUS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedToId?: number;
}
