import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AppRole, AuthClaims } from '../auth/auth-claims';
import { User } from '../db/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** JIT-provision: find the local profile for a Cognito identity, creating it on first sight. */
  async findOrCreateFromClaims(claims: AuthClaims): Promise<User> {
    const existing = await this.usersRepository.findByCognitoSub(claims.sub);
    if (existing) {
      // The DB is the source of truth for roles after first login, so admins can manage them
      // in-app. Cognito groups only seed the role when the profile is first created (below).
      return existing;
    }

    const [firstName, ...rest] = (claims.name ?? '').trim().split(' ');
    return this.usersRepository.create({
      cognitoSub: claims.sub,
      email: claims.email,
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      role: this.roleFromGroups(claims.roles),
    });
  }

  /** Admin action: change a user's role. Guards against self-demotion (locking out the last admin). */
  async updateRole(id: number, role: AppRole, requesterId: number): Promise<User> {
    if (id === requesterId) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const user = await this.usersRepository.update(id, { role });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /** Admin action: assign a user to a team (or clear it with null). */
  async assignTeam(id: number, teamId: number | null): Promise<User> {
    const user = await this.usersRepository.update(id, { teamId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.update(id, dto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: number, requesterId: number): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const ok = await this.usersRepository.delete(id);
    if (!ok) {
      throw new NotFoundException('User not found');
    }
  }

  private roleFromGroups(groups: string[]): AppRole {
    if (groups.includes('admin')) return 'admin';
    if (groups.includes('agent')) return 'agent';
    return 'user';
  }
}
