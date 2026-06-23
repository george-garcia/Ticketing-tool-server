import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DevAuthService } from './dev-auth.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { Public } from './public.decorator';

@ApiTags('Auth (dev only)')
@Controller('auth')
export class DevAuthController {
  constructor(private readonly devAuth: DevAuthService) {}

  @Public()
  @Post('dev-login')
  @ApiOperation({ summary: 'Issue a dev token (only when AUTH_MODE=dev)' })
  login(@Body() dto: DevLoginDto) {
    return { token: this.devAuth.issue(dto) };
  }
}
