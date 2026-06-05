import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';
import { RedisService } from 'src/redis/redis.service';

const FIND_ALL_PREFIX = 'products:find_all';
const FIND_ONE_PREFIX = 'products:find_one';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductService');

  constructor(private readonly redis: RedisService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  private findAllKey({ page, limit }: PaginationDto) {
    return `${FIND_ALL_PREFIX}:page=${page}:limit=${limit}`;
  }

  private findOneKey(id: number) {
    return `${FIND_ONE_PREFIX}:${id}`;
  }

  private async invalidateProductCache(id?: number) {
    await this.redis.delByPattern(`${FIND_ALL_PREFIX}:*`);
    if (id !== undefined) {
      await this.redis.del(this.findOneKey(id));
    }
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.product.create({
      data: createProductDto,
    });
    await this.invalidateProductCache();
    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const cacheKey = this.findAllKey(paginationDto);

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT ${cacheKey}`);
      return cached;
    }
    this.logger.log(`Cache MISS ${cacheKey}`);

    const total = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(total / limit);
    const result = {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        lastPage,
        page,
        total,
      },
    };

    await this.redis.set(cacheKey, result);
    return result;
  }

  async findOne(id: number) {
    const cacheKey = this.findOneKey(id);

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT ${cacheKey}`);
      return cached;
    }
    this.logger.log(`Cache MISS ${cacheKey}`);

    const product = await this.product.findFirst({
      where: {
        id,
        available: true,
      },
    });

    if (!product)
      throw new RpcException({
        message: `Product with id #${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });

    await this.redis.set(cacheKey, product);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: _, ...data } = updateProductDto;
    await this.findOne(id);
    const product = await this.product.update({
      where: {
        id,
      },
      data,
    });
    await this.invalidateProductCache(id);
    return product;
  }

  async remove(id: number) {
    await this.findOne(id);
    const product = await this.product.update({
      where: {
        id,
      },
      data: {
        available: false,
      },
    });
    await this.invalidateProductCache(id);
    return product;
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
