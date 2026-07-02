import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';

@Module({
  providers: [SettingsService, SettingsRepository],
  controllers: [SettingsController],
})
export class SettingsModule {}
