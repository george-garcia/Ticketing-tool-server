import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AppRole } from '../../auth/auth-claims';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['user', 'agent', 'admin'] })
  @IsIn(['user', 'agent', 'admin'])
  role!: AppRole;
}
