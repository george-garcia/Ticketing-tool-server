import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (for assignment dropdowns)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@CurrentUser('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  updateMe(@CurrentUser('id') id: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: "Change a user's role (admin only)" })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') requesterId: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role, requesterId);
  }

  @Patch(':id/team')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign a user to a team (admin only)' })
  assignTeam(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignTeamDto) {
    return this.usersService.assignTeam(id, dto.teamId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') requesterId: number) {
    await this.usersService.remove(id, requesterId);
    return { deleted: true };
  }
}
