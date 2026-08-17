import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Order, PaymentStatus, OrderStatus, PaymentMethod } from '../order/entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) { }

  private getConfig() {
    return {
      appId: this.configService.get<string>('ZALOPAY_APP_ID')!,
      key1: this.configService.get<string>('ZALOPAY_KEY1')!,
      key2: this.configService.get<string>('ZALOPAY_KEY2')!,
      createEndpoint: this.configService.get<string>('ZALOPAY_CREATE_ENDPOINT')!,
      queryEndpoint: this.configService.get<string>('ZALOPAY_QUERY_ENDPOINT')!,
    };
  }

  async createPaymentUrl(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán');
    }

    const { appId, key1, createEndpoint } = this.getConfig();

    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const appTransId = `${yy}${mm}${dd}_${orderId}${Date.now().toString().slice(-6)}`;

    const embedData = JSON.stringify({ orderId: order.id });
    const items = JSON.stringify([{ orderId: order.id }]);
    const amount = Math.round(Number(order.total_price));
    const appTime = Date.now();

    const orderPayload = {
      app_id: Number(appId),
      app_trans_id: appTransId,
      app_user: `buyer_${buyerId}`,
      app_time: appTime,
      amount,
      item: items,
      embed_data: embedData,
      description: `Thanh toan don hang #${order.id} - GreenFarmer`,
      bank_code: '',
    };

    const dataToSign = [
      orderPayload.app_id,
      orderPayload.app_trans_id,
      orderPayload.app_user,
      orderPayload.amount,
      orderPayload.app_time,
      orderPayload.embed_data,
      orderPayload.item,
    ].join('|');

    const mac = crypto.createHmac('sha256', key1).update(dataToSign).digest('hex');

    const body: Record<string, string> = {
      app_id: String(orderPayload.app_id),
      app_trans_id: orderPayload.app_trans_id,
      app_user: orderPayload.app_user,
      app_time: String(orderPayload.app_time),
      amount: String(orderPayload.amount),
      item: orderPayload.item,
      embed_data: orderPayload.embed_data,
      description: orderPayload.description,
      bank_code: orderPayload.bank_code,
      mac,
    };

    const response = await fetch(createEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });

    const result = await response.json();

    if (result.return_code !== 1) {
      throw new BadRequestException(`Tạo giao dịch ZaloPay thất bại: ${result.return_message}`);
    }

    order.app_trans_id = appTransId;
    order.payment_method = PaymentMethod.ZALOPAY;
    await this.orderRepo.save(order);

    return {
      orderUrl: result.order_url,
      appTransId,
    };
  }

  async queryStatus(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order || !order.app_trans_id) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán cho đơn hàng này');
    }

    const { appId, key1, queryEndpoint } = this.getConfig();

    const dataToSign = `${appId}|${order.app_trans_id}|${key1}`;
    const mac = crypto.createHmac('sha256', key1).update(dataToSign).digest('hex');

    const response = await fetch(queryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        app_id: String(appId),
        app_trans_id: order.app_trans_id,
        mac,
      }).toString(),
    });

    const result = await response.json();

    // return_code = 1: thanh toán thành công
    if (result.return_code === 1 && order.payment_status !== PaymentStatus.PAID) {
      order.payment_status = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    return result;
  }

  // Dành cho callback thật từ ZaloPay (sau khi bạn có sandbox riêng + khai báo được callback URL)
  async handleCallback(body: { data: string; mac: string }) {
    const { key2 } = this.getConfig();

    const computedMac = crypto.createHmac('sha256', key2).update(body.data).digest('hex');

    if (computedMac !== body.mac) {
      return { return_code: -1, return_message: 'mac not equal' };
    }

    const data = JSON.parse(body.data);
    const appTransId = data.app_trans_id;

    const order = await this.orderRepo.findOne({ where: { app_trans_id: appTransId } });
    if (!order) {
      return { return_code: 0, return_message: 'order not found' };
    }

    if (order.payment_status !== PaymentStatus.PAID) {
      order.payment_status = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    return { return_code: 1, return_message: 'success' };
  }
}