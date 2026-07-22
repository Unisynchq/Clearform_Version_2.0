import { Global, Module } from '@nestjs/common';
import { FormAiRateLimitService } from './form-ai-rate-limit.service';

@Global()
@Module({
  providers: [FormAiRateLimitService],
  exports: [FormAiRateLimitService],
})
export class CommonModule {}
