import {
  Controller, Delete, Get, Param, ParseIntPipe, Patch, Body, Query, UseGuards,
} from '@nestjs/common';
import { ProductsService } from '../products.service';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductAdminController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  async findAll(@Query() query: GetProductsDto) {
    const data = await this.productService.findAllForAdmin(query);
    return { success: true, message: 'Lấy danh sách sản phẩm thành công', data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productService.findOne(id);
    return { success: true, message: 'Lấy thông tin sản phẩm thành công', data };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    const data = await this.productService.update(id, dto);
    return { success: true, message: 'Cập nhật sản phẩm thành công', data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productService.remove(id);
    return { success: true, ...data };
  }
}
