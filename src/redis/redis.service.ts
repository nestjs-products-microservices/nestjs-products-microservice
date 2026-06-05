import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { envs } from 'src/config';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('RedisService');

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttl: number = envs.REDIS_TTL) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const pipeline = this.client.pipeline();
      let found = 0;

      stream.on('data', (keys: string[]) => {
        for (const key of keys) {
          pipeline.del(key);
          found++;
        }
      });

      stream.on('end', () => {
        if (found === 0) return resolve();
        pipeline.exec((err) => {
          if (err) {
            this.logger.error(`Error deleting keys for pattern ${pattern}`, err);
            return reject(err);
          }
          resolve();
        });
      });

      stream.on('error', (err) => {
        this.logger.error(`Error scanning keys for pattern ${pattern}`, err);
        reject(err);
      });
    });
  }
}