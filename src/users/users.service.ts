import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from './users.repository';
import { AppRole, AuthClaims } from '../auth/auth-claims';
import { User } from '../db/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  /** Emails that are always granted admin (comma-separated ADMIN_EMAILS). Bootstraps the first admin. */
  private adminEmails(): Set<string> {
    return new Set(
      (this.config.get<string>('ADMIN_EMAILS', '') || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  /**
   * JIT-provision the local profile for an authenticated identity, creating it on first sight.
   *
   * Authorization is owned entirely by the app DB: new users start as 'user' (requester) and are
   * promoted to agent/admin in the Admin panel. The identity provider (Cognito or the dev seam)
   * never dictates roles. The one exception is the ADMIN_EMAILS allowlist, which is always forced
   * to admin so the first admin can be bootstrapped without direct DB access.
   */
  async findOrCreateFromClaims(claims: AuthClaims): Promise<User> {
    const isBootstrapAdmin = this.adminEmails().has((claims.email ?? '').toLowerCase());
    const existing = await this.usersRepository.findByCognitoSub(claims.sub);
    if (existing) {
      if (isBootstrapAdmin && existing.role !== 'admin') {
        return (await this.usersRepository.update(existing.id, { role: 'admin' })) ?? existing;
      }
      return existing;
    }

    const [firstName, ...rest] = (claims.name ?? '').trim().split(' ');
    return this.usersRepository.create({
      cognitoSub: claims.sub,
      email: claims.email,
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      role: isBootstrapAdmin ? 'admin' : 'user',
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
}
