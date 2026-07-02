import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayMaxSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateTicketDto } from './update-ticket.dto';

/** Apply one set of changes (status/assignee/priority/…) to a batch of tickets. */
export class BulkUpdateDto {
  @ApiProperty({ type: [Number], description: 'Ticket IDs to update' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  ids!: number[];

  @ApiProperty({ type: UpdateTicketDto })
  @ValidateNested()
  @Type(() => UpdateTicketDto)
  changes!: UpdateTicketDto;
}

/** Delete a batch of tickets. */
export class BulkDeleteDto {
  @ApiProperty({ type: [Number], description: 'Ticket IDs to delete' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  ids!: number[];
}
