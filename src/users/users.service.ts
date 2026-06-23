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
    const role = this.roleFromGroups(claims.roles);
    const existing = await this.usersRepository.findByCognitoSub(claims.sub);
    if (existing) {
      // Cognito groups are the source of truth for roles — keep the profile in sync.
      if (existing.role !== role) {
        return (await this.usersRepository.update(existing.id, { role })) ?? existing;
      }
      return existing;
    }

    const [firstName, ...rest] = (claims.name ?? '').trim().split(' ');
    return this.usersRepository.create({
      cognitoSub: claims.sub,
      email: claims.email,
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      role,
    });
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
