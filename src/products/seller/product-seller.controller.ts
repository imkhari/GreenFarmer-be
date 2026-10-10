import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query,
  Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('seller/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class ProductSellerController {
  constructor(private readonly productService: ProductsService) { }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductDto) {
    return this.productService.create(dto, Number(req.user.sub));
  }

  @Get()
  findMine(@Req() req: AuthenticatedRequest, @Query('farm_id') farmId?: string) {
    const sellerId = Number(req.user.sub);
    if (farmId === undefined || farmId === '') {
      return this.productService.findAllBySeller(sellerId);
    }
    const id = Number(farmId);
    if (!Number.isInteger(id)) throw new BadRequestException('farm_id phải là số');
    return this.productService.findByFarm(id, sellerId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id, Number(req.user.sub));
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto, Number(req.user.sub));
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id, Number(req.user.sub));
  }
}

interface AuthenticatedRequest extends Request {
  user: { sub: number | string; email: string; role: string };
}
