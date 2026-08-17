import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Farm } from 'src/farm/entities/farm.entity';
import { Batch } from 'src/batch/entities/batch.entity';
import { Review } from './entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Farm, Batch, Review ])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
