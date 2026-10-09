import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Order, PaymentStatus, OrderStatus, PaymentMethod } from '../order/entities/order.entity';
import qs from 'qs';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) { }

  private getVnpayConfig() {
    return {
      tmnCode: this.configService.get<string>('VNP_TMN_CODE')!,
      hashSecret: this.configService.get<string>('VNP_HASH_SECRET')!,
      vnpUrl: this.configService.get<string>('VNP_URL')!,
      returnUrl: this.configService.get<string>('VNP_RETURN_URL')!,
      apiUrl: this.configService.get<string>('VNP_API_URL')!,
    };
  }
  private sortObject(obj: Record<string, any>) {
    const sorted: Record<string, string> = {};
    const keys: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    keys.sort();

    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }

    return sorted;
  }

  async createVnpayPaymentUrl(buyerId: number, orderId: number, ipAddr: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán');
    }

    const { tmnCode, hashSecret, vnpUrl, returnUrl } = this.getVnpayConfig();

    const now = new Date();
    const createDate =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const txnRef = `${orderId}_${Date.now()}`;
    const amount = Math.round(Number(order.total_price)) * 100;

    const rawParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(amount),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(rawParams); // đã encode sẵn trong này

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const finalParams = { ...sortedParams, vnp_SecureHash: signed };
    const paymentUrl = `${vnpUrl}?${qs.stringify(finalParams, { encode: false })}`;

    order.app_trans_id = txnRef;
    order.payment_method = PaymentMethod.VNPAY;
    await this.orderRepo.save(order);

    console.log('===== VNPAY DEBUG =====');
    console.log('TMN CODE:', tmnCode);
    console.log('VNP URL:', vnpUrl);
    console.log('RETURN URL:', returnUrl);
    console.log('PAYMENT URL:', paymentUrl);
    console.log('=======================');

    return { paymentUrl, txnRef };
  }
  async handleVnpayReturn(query: Record<string, string>) {
    const { hashSecret } = this.getVnpayConfig();

    const vnpParams = { ...query };
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = this.sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', hashSecret);
    const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (checkSum.toLowerCase() !== (secureHash ?? '').toLowerCase()) {
      return { success: false, message: 'Chữ ký không hợp lệ' };
    }

    const txnRef = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;

    const order = await this.orderRepo.findOne({ where: { app_trans_id: txnRef } });
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    if (responseCode === '00') {
      if (order.payment_status !== PaymentStatus.PAID) {
        order.payment_status = PaymentStatus.PAID;
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }
      return { success: true, message: 'Thanh toán thành công', orderId: order.id };
    }

    return { success: false, message: 'Thanh toán không thành công hoặc đã bị huỷ', orderId: order.id };
  }
}