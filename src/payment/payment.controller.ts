import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import express from 'express';
import * as querystring from 'querystring';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

//   @Post('zalopay/:orderId')
//   @UseGuards(JwtAuthGuard,RolesGuard)
//   @Roles('buyer')
//   createPayment(@CurrentUser() user: any, @Param('orderId',ParseIntPipe) orderId: number){
//     return this.paymentService.createPaymentUrl(user.sub,orderId);
//   }

// // zalopay tự động gọi
// @Post('zalopay/callback')
// handleCallback(@Body() body: {data: string; mac: string }){
//   return this.paymentService.handleCallback(body)
// }
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

}
