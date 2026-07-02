import { IsInt, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeamDto {
  // `null` clears the team; a number assigns it to that team.
  @ApiProperty({ type: Number, nullable: true })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  teamId!: number | null;
}
