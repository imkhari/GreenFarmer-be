import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Farm } from 'src/farm/entities/farm.entity';
import { Batch } from 'src/batch/entities/batch.entity';
import { Review } from './entities/review.entity';
import { Category } from 'src/category/entities/category.entity';
import { ProductAdminController } from './admin/product-admin.comtroller';
import { ProductSellerController } from './seller/product-seller.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Farm, Batch, Review, Category ])],
  controllers: [ProductsController,
    ProductAdminController,
    ProductSellerController,
  ],
  providers: [ProductsService],
})
export class ProductsModule {}
