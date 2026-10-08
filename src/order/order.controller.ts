import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('buyer')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user.sub, dto);
  }

  @Get()
  getMyOrders(@CurrentUser() user: any) {
    return this.orderService.getMyOrders(user.sub);
  }
  @Get('seller')
  @Roles('seller')
  getSellerOrders(@CurrentUser() user: any, @Query('status') status?: OrderStatus) {
    return this.orderService.getSellerOrders(user.sub, status);
  }
  @Get(':id')
  getOrderDetail(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderDetail(user.sub, id);
  }
  @Get('admin/all')
  @Roles('admin')
  getAllForAdmin() {
    return this.orderService.findAllAdmin();
  }
}