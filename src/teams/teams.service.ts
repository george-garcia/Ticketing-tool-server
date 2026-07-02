import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamsRepository } from './teams.repository';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly teamsRepository: TeamsRepository) {}

  findAll() {
    return this.teamsRepository.findAll();
  }

  async create(dto: CreateTeamDto) {
    const name = dto.name.trim();
    if (await this.teamsRepository.findByName(name)) {
      throw new ConflictException('A team with that name already exists');
    }
    return this.teamsRepository.create({ name });
  }

  async update(id: number, dto: UpdateTeamDto) {
    const name = dto.name.trim();
    const existing = await this.teamsRepository.findByName(name);
    if (existing && existing.id !== id) {
      throw new ConflictException('A team with that name already exists');
    }
    const team = await this.teamsRepository.update(id, { name });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async remove(id: number): Promise<void> {
    // Members' team_id is set null by the FK; tickets are unaffected.
    const ok = await this.teamsRepository.delete(id);
    if (!ok) {
      throw new NotFoundException('Team not found');
    }
  }
}
