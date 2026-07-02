import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from '../db/schema';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  /** Returns the settings row, creating it with defaults on first access. */
  async get(): Promise<AppSettings> {
    return (await this.settingsRepository.get()) ?? (await this.settingsRepository.upsert({}));
  }

  update(dto: UpdateSettingsDto): Promise<AppSettings> {
    return this.settingsRepository.upsert(dto);
  }
}
