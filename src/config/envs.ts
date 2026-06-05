import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  DATABASE_URL: get('DATABASE_URL').required().asString(),

  NATS_SERVERS: get('NATS_SERVERS').required().asString(),

  REDIS_HOST: get('REDIS_HOST').required().asString(),
  REDIS_PORT: get('REDIS_PORT').required().asPortNumber(),
  REDIS_TTL: get('REDIS_TTL').default(30).asIntPositive(),
};
