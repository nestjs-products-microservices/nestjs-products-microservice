import { Global, Logger, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { envs } from 'src/config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const logger = new Logger('RedisModule');
    const client = new Redis({
      host: envs.REDIS_HOST,
      port: envs.REDIS_PORT,
    });

    client.on('connect', () => logger.log('Redis connected'));
    client.on('error', (err) => logger.error('Redis error', err.message));

    return client;
  },
};

@Global()
@Module({
  providers: [redisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}