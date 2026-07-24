import { Global, Module } from '@nestjs/common';
import { FormAiRateLimitService } from './form-ai-rate-limit.service';
import { IsValidUuidConstraint } from './validators/uuid.validator';
import { PasswordComplexityConstraint } from './validators/password.validator';

@Global()
@Module({
  providers: [
    FormAiRateLimitService,
    IsValidUuidConstraint,
    PasswordComplexityConstraint,
  ],
  exports: [
    FormAiRateLimitService,
    IsValidUuidConstraint,
    PasswordComplexityConstraint,
  ],
})
export class CommonModule {}
