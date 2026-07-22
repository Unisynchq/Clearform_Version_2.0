import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { createRedisOptions } from './connection.options';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        return new Redis(
          createRedisOptions(config.getOrThrow<string>('REDIS_URL')),
        );
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
