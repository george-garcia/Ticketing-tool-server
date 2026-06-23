import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TICKET_STATUS = ['Open', 'Assigned', 'Pending', 'In progress', 'Resolved', 'Closed'] as const;
export const TICKET_PRIORITY = ['Minor', 'Major', 'Critical'] as const;
export const TICKET_IMPACT = ['Low', 'Medium', 'High'] as const;
export const TICKET_CATEGORY = ['Incident', 'Problem', 'Major Incident'] as const;

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ enum: TICKET_STATUS })
  @IsOptional()
  @IsEnum(TICKET_STATUS)
  status?: (typeof TICKET_STATUS)[number];

  @ApiPropertyOptional({ enum: TICKET_PRIORITY })
  @IsOptional()
  @IsEnum(TICKET_PRIORITY)
  priority?: (typeof TICKET_PRIORITY)[number];

  @ApiPropertyOptional({ enum: TICKET_IMPACT })
  @IsOptional()
  @IsEnum(TICKET_IMPACT)
  impact?: (typeof TICKET_IMPACT)[number];

  @ApiPropertyOptional({ enum: TICKET_CATEGORY })
  @IsOptional()
  @IsEnum(TICKET_CATEGORY)
  category?: (typeof TICKET_CATEGORY)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  product?: string;

  // `null` unassigns the ticket; a number assigns it to that user id.
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  assignedToId?: number | null;

  @ApiPropertyOptional({ description: 'Optional initial comment to attach on creation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
