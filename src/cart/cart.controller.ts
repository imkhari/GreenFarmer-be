import {Controller, Get, Post,  Patch,Delete,Body, Param,ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateCartItemDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart';

@Controller('cart')
// @UseGuards(JwtAuthGuard, RolesGuard) // áp dụng cho toàn bộ controller: bắt buộc đăng nhập
// @Roles('buyer') // chỉ buyer được thao tác giỏ hàng
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  getMyCart(@CurrentUser() user: any) {
    return this.cartService.getMyCart(user.sub);
  }

  @Post()
  addToCart(@CurrentUser() user: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.sub, dto);
  }

  @Patch(':id')
  updateItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, id, dto);
  }

  @Delete(':id')
  removeItem(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeItem(user.sub, id);
  }
}