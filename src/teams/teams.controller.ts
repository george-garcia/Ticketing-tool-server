import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List teams with member counts' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a team (admin only)' })
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Rename a team (admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a team (admin only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.teamsService.remove(id);
    return { deleted: true };
  }
}
