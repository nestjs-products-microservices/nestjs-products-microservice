import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule, ProductsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
