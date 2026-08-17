import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { Batch } from 'src/batch/entities/batch.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderDetail, Cart, Batch])],

  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
