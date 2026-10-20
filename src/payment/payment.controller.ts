import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import express from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ==========================================
  // 1. VNPAY ENDPOINTS
  // ==========================================
  @Post('vnpay/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer')
  createVnpayPayment(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Req() req: express.Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.paymentService.createVnpayPaymentUrl(user.sub, orderId, ipAddr);
  }

  @Get('vnpay/return')
  handleVnpayReturn(@Query() query: Record<string, string>) {
    return this.paymentService.handleVnpayReturn(query);
  }

  // ==========================================
  // 2. MOMO ENDPOINTS
  // ==========================================
  @Post('momo/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer')
  createMomoPayment(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.createMomoPaymentUrl(user.sub, orderId);
  }

  @Get('momo/return')
  handleMomoReturn(@Query() query: Record<string, string>) {
    return this.paymentService.handleMomoReturn(query);
  }

  // ==========================================
  // 3. ZALOPAY ENDPOINTS
  // ==========================================
  @Post('zalopay/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer')
  createZaloPayPayment(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.createZaloPayPaymentUrl(user.sub, orderId);
  }

  @Get('zalopay/return')
  handleZaloPayReturn(@Query() query: Record<string, string>) {
    return this.paymentService.handleZaloPayReturn(query);
  }
}
