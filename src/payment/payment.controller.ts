import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('zalopay/:orderId')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('buyer')
  createPayment(@CurrentUser() user: any, @Param('orderId',ParseIntPipe) orderId: number){
    return this.paymentService.createPaymentUrl(user.sub,orderId);
  }

// zalopay tự động gọi
@Post('zalopay/callback')
handleCallback(@Body() body: {data: string; mac: string }){
  return this.paymentService.handleCallback(body)
}

}
