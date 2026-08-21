import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Batch } from 'src/batch/entities/batch.entity';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) { }

  async getMyCart(buyerId: number) {
    const items = await this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.batch', 'batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('product.farm', 'farm')
      .where('cart.buyer_id = :buyerId', { buyerId })
      .orderBy('cart.created_at', 'DESC')
      .getMany();

    const data = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      batch: {
        id: item.batch.id,
        batchCode: item.batch.batch_code,
        quantityAvailable: item.batch.quantity, // tồn kho thực tế
      },
      product: item.batch.product
        ? {
          id: item.batch.product.id,
          name: item.batch.product.name,
          price: item.batch.product.price,
        }
        : null,
      farmName: item.batch.product?.farm?.farm_name,
      subtotal: item.batch.product ? Number(item.batch.product.price) * item.quantity : 0,
    }));

    const totalAmount = data.reduce((sum, item) => sum + item.subtotal, 0);

    return { items: data, totalAmount };
  }

  // Thêm sản phẩm vào giỏ (hoặc cộng dồn nếu đã có)
  async addToCart(buyerId: number, dto: AddToCartDto) {
    const batch = await this.batchRepo.findOneBy({ id: dto.batchId });
    if (!batch) {
      throw new NotFoundException('Không tìm thấy lô hàng');
    }

    if (batch.approval_status !== 'Approved') {
      throw new BadRequestException('Lô hàng này chưa được duyệt, không thể mua');
    }

    if (dto.quantity > batch.quantity) {
      throw new BadRequestException(`Chỉ còn ${batch.quantity} sản phẩm trong lô này`);
    }

    let cartItem = await this.cartRepo.findOne({
      where: { buyer: { id: buyerId }, batch: { id: dto.batchId } },
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + dto.quantity;
      if (newQuantity > batch.quantity) {
        throw new BadRequestException(`Chỉ còn ${batch.quantity} sản phẩm, giỏ hàng hiện đã có ${cartItem.quantity}`);
      }
      cartItem.quantity = newQuantity;
    } else {
      cartItem = this.cartRepo.create({
        buyer: { id: buyerId } as any,
        batch: { id: dto.batchId } as any,
        quantity: dto.quantity,
      });
    }

    await this.cartRepo.save(cartItem);
    return { message: 'Đã thêm vào giỏ hàng' };
  }

  async updateItem(buyerId: number, cartItemId: number, dto: UpdateCartItemDto) {
    const cartItem = await this.cartRepo.findOne({
      where: { id: cartItemId },
      relations: { buyer: true, batch: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    if (cartItem.buyer.id !== buyerId) {
      throw new ForbiddenException('Bạn không có quyền sửa giỏ hàng này');
    }

    if (dto.quantity > cartItem.batch.quantity) {
      throw new BadRequestException(`Chỉ còn ${cartItem.batch.quantity} sản phẩm`);
    }

    cartItem.quantity = dto.quantity;
    await this.cartRepo.save(cartItem);
    return { message: 'Đã cập nhật số lượng' };
  }

  // Xóa 1 dòng khỏi giỏ
  async removeItem(buyerId: number, cartItemId: number) {
    const cartItem = await this.cartRepo.findOne({
      where: { id: cartItemId },
      relations: { buyer: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    if (cartItem.buyer.id !== buyerId) {
      throw new ForbiddenException('Bạn không có quyền xóa giỏ hàng này');
    }

    await this.cartRepo.remove(cartItem);
    return { message: 'Đã xóa khỏi giỏ hàng' };
  }
}
