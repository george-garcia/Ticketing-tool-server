import { Module } from '@nestjs/common';
import { CognitoVerifierService } from './cognito-verifier.service';
import { DevAuthService } from './dev-auth.service';
import { DevAuthController } from './dev-auth.controller';

@Module({
  providers: [CognitoVerifierService, DevAuthService],
  controllers: [DevAuthController],
  exports: [CognitoVerifierService],
})
export class AuthModule {}
