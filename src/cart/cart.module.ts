import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Batch } from 'src/batch/entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Batch])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule { }
