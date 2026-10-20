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

  // ==========================================
  // CẤU HÌNH VNPAY
  // ==========================================
  private getVnpayConfig() {
    return {
      tmnCode: this.configService.get<string>('VNP_TMN_CODE')!,
      hashSecret: this.configService.get<string>('VNP_HASH_SECRET')!,
      vnpUrl: this.configService.get<string>('VNP_URL')!,
      returnUrl: this.configService.get<string>('VNP_RETURN_URL')!,
      apiUrl: this.configService.get<string>('VNP_API_URL')!,
    };
  }

  // ==========================================
  // CẤU HÌNH MOMO
  // ==========================================
  private getMomoConfig() {
    return {
      partnerCode: this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO',
      accessKey: this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85',
      secretKey: this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
      createEndpoint: this.configService.get<string>('MOMO_CREATE_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create',
      redirectUrl: this.configService.get<string>('MOMO_REDIRECT_URL') || 'http://localhost:5173/payment/momo/return',
      ipnUrl: this.configService.get<string>('MOMO_IPN_URL') || 'http://localhost:3000/payment/momo/ipn',
    };
  }

  // ==========================================
  // CẤU HÌNH ZALOPAY
  // ==========================================
  private getZaloPayConfig() {
    return {
      appId: Number(this.configService.get<string>('ZALOPAY_APP_ID') || 2553),
      key1: this.configService.get<string>('ZALOPAY_KEY1') || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
      key2: this.configService.get<string>('ZALOPAY_KEY2') || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
      createEndpoint: this.configService.get<string>('ZALOPAY_CREATE_ENDPOINT') || 'https://sb-openapi.zalopay.vn/v2/create',
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

  // ==========================================
  // 1. VNPAY INTEGRATION
  // ==========================================
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

    const sortedParams = this.sortObject(rawParams);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const finalParams = { ...sortedParams, vnp_SecureHash: signed };
    const paymentUrl = `${vnpUrl}?${qs.stringify(finalParams, { encode: false })}`;

    order.app_trans_id = txnRef;
    order.payment_method = PaymentMethod.VNPAY;
    await this.orderRepo.save(order);
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

  // ==========================================
  // 2. MOMO INTEGRATION
  // ==========================================
  async createMomoPaymentUrl(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán');
    }

    const { partnerCode, accessKey, secretKey, createEndpoint, redirectUrl, ipnUrl } = this.getMomoConfig();
    const amount = Math.round(Number(order.total_price));
    const momoOrderId = `MOMO_${orderId}_${Date.now()}`;
    const requestId = momoOrderId;
    const orderInfo = `Thanh toan don hang #${orderId} - GreenFarmer`;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const response = await fetch(createEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerCode,
        partnerName: 'GreenFarmer',
        storeId: 'GreenFarmerStore',
        requestId,
        amount,
        orderId: momoOrderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: 'vi',
        requestType,
        autoCapture: true,
        extraData,
        signature,
      }),
    });

    const data = await response.json() as any;
    if (data.resultCode !== 0) {
      throw new BadRequestException(data.message || 'Khởi tạo thanh toán MoMo thất bại');
    }

    order.app_trans_id = momoOrderId;
    order.payment_method = PaymentMethod.MOMO;
    await this.orderRepo.save(order);

    return { paymentUrl: data.payUrl, txnRef: momoOrderId };
  }

  async handleMomoReturn(query: Record<string, string>) {
    const { accessKey, secretKey } = this.getMomoConfig();
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = query;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const checkSum = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (checkSum !== signature) {
      return { success: false, message: 'Chữ ký MoMo không hợp lệ' };
    }

    const order = await this.orderRepo.findOne({ where: { app_trans_id: orderId } });
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    if (String(resultCode) === '0') {
      if (order.payment_status !== PaymentStatus.PAID) {
        order.payment_status = PaymentStatus.PAID;
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }
      return { success: true, message: 'Thanh toán MoMo thành công', orderId: order.id };
    }

    return { success: false, message: message || 'Thanh toán MoMo không thành công', orderId: order.id };
  }

  // ==========================================
  // 3. ZALOPAY INTEGRATION
  // ==========================================
  async createZaloPayPaymentUrl(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Đơn hàng này đã được thanh toán');
    }

    const { appId, key1, createEndpoint } = this.getZaloPayConfig();
    const date = new Date();
    const yyMMdd = String(date.getFullYear()).slice(-2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const appTransId = `${yyMMdd}_${orderId}_${Date.now()}`;
    const appTime = Date.now();
    const appUser = `user_${buyerId}`;
    const amount = Math.round(Number(order.total_price));
    const description = `GreenFarmer - Thanh toan don hang #${orderId}`;
    const embedData = JSON.stringify({ redirecturl: 'http://localhost:5173/payment/zalopay/return' });
    const items = JSON.stringify([{ itemid: String(orderId), itemname: `Don hang GreenFarmer #${orderId}`, itemprice: amount, itemquantity: 1 }]);

    const rawData = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${items}`;
    const mac = crypto.createHmac('sha256', key1).update(rawData).digest('hex');

    const params = new URLSearchParams({
      app_id: String(appId),
      app_user: appUser,
      app_time: String(appTime),
      amount: String(amount),
      app_trans_id: appTransId,
      embed_data: embedData,
      item: items,
      description,
      bank_code: '',
      mac,
    });

    const response = await fetch(createEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json() as any;
    if (data.return_code !== 1) {
      throw new BadRequestException(data.return_message || 'Khởi tạo thanh toán ZaloPay thất bại');
    }

    order.app_trans_id = appTransId;
    order.payment_method = PaymentMethod.ZALOPAY;
    await this.orderRepo.save(order);

    return { paymentUrl: data.order_url, txnRef: appTransId };
  }

  async handleZaloPayReturn(query: Record<string, string>) {
    const { key2 } = this.getZaloPayConfig();
    const { appid, apptransid, pmcid, bankcode, amount, discountamount, status, checksum } = query;

    const rawData = `${appid}|${apptransid}|${pmcid}|${bankcode}|${amount}|${discountamount}|${status}`;
    const checkSum = crypto.createHmac('sha256', key2).update(rawData).digest('hex');

    if (checkSum !== checksum) {
      return { success: false, message: 'Chữ ký ZaloPay không hợp lệ' };
    }

    const order = await this.orderRepo.findOne({ where: { app_trans_id: apptransid } });
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    if (String(status) === '1') {
      if (order.payment_status !== PaymentStatus.PAID) {
        order.payment_status = PaymentStatus.PAID;
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }
      return { success: true, message: 'Thanh toán ZaloPay thành công', orderId: order.id };
    }

    return { success: false, message: 'Thanh toán ZaloPay không thành công hoặc đã bị huỷ', orderId: order.id };
  }
}