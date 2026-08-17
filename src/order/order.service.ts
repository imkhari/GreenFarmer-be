// src/order/order.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Batch } from '../batch/entities/batch.entity';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    private readonly dataSource: DataSource,
  ) { }

  async checkout(buyerId: number, dto: CheckoutDto) {
    const cartItems = await this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.batch', 'batch')
      .leftJoinAndSelect('batch.product', 'product')
      .where('cart.id IN (:...ids)', { ids: dto.cartItemIds })
      .andWhere('cart.buyer_id = :buyerId', { buyerId })
      .getMany();

    if (cartItems.length !== dto.cartItemIds.length) {
      throw new BadRequestException('Một số sản phẩm trong giỏ không hợp lệ hoặc không thuộc về bạn');
    }

    for (const item of cartItems) {
      if (item.quantity > item.batch.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${item.batch.product?.name}" chỉ còn ${item.batch.quantity}, không đủ số lượng bạn chọn`,
        );
      }
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + Number(item.batch.product.price) * item.quantity,
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        buyer: { id: buyerId } as any,
        receiver_name: dto.receiverName,
        receiver_phone: dto.receiverPhone,
        shipping_address: dto.shippingAddress,
        total_price: totalPrice,
        status: OrderStatus.PENDING,
        payment_method: dto.paymentMethod as any, 
        payment_status: PaymentStatus.UNPAID,
      });
      const savedOrder = await manager.save(order);

      for (const item of cartItems) {
        const detail = manager.create(OrderDetail, {
          order: { id: savedOrder.id } as any,
          batch: { id: item.batch.id } as any,
          quantity: item.quantity,
          price: item.batch.product.price,
        });
        await manager.save(detail);

        await manager.decrement(Batch, { id: item.batch.id }, 'quantity', item.quantity);
      }

      await manager.delete(Cart, dto.cartItemIds);

      return { orderId: savedOrder.id, totalPrice, message: 'Đặt hàng thành công' };
    });
  }

  async getMyOrders(buyerId: number) {
    return this.orderRepo.find({
      where: { buyer: { id: buyerId } },
      order: { created_at: 'DESC' },
    });
  }

  async getOrderDetail(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
      relations: { details: { batch: { product: true } } },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }
}