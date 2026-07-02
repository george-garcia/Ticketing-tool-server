import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const HOURS_IN_90_DAYS = 2160;

/** SLA resolution targets (hours) per priority. */
export class UpdateSettingsDto {
  @ApiProperty({ minimum: 1, maximum: HOURS_IN_90_DAYS })
  @IsInt()
  @Min(1)
  @Max(HOURS_IN_90_DAYS)
  slaCriticalHours!: number;

  @ApiProperty({ minimum: 1, maximum: HOURS_IN_90_DAYS })
  @IsInt()
  @Min(1)
  @Max(HOURS_IN_90_DAYS)
  slaMajorHours!: number;

  @ApiProperty({ minimum: 1, maximum: HOURS_IN_90_DAYS })
  @IsInt()
  @Min(1)
  @Max(HOURS_IN_90_DAYS)
  slaMinorHours!: number;
}
