import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get global settings (SLA targets)' })
  get() {
    return this.settingsService.get();
  }

  @Put()
  @Roles('admin')
  @ApiOperation({ summary: 'Update global settings (admin only)' })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
