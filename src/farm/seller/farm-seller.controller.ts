import {
  Body, Controller, Delete, Get, Param,
  ParseIntPipe, Patch, Post, Query,
  Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { FarmService } from '../farm.service';
import { CreateFarmDto } from '../dto/create-farm.dto';
import { UpdateFarmDto } from '../dto/update-farm.dto';
import { QueryFarmDto } from '../dto/query-farm.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('seller/farms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class FarmSellerController {
  constructor(private readonly farmService: FarmService) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateFarmDto) {
    const sellerId = Number(req.user.sub);
    const data = await this.farmService.create({ ...dto, seller_id: sellerId });
    return { success: true, message: 'Tạo Farm thành công', data };
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest, @Query() query: QueryFarmDto) {
    return this.farmService.findAllBySeller(Number(req.user.sub), query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const data = await this.farmService.findOneBySeller(id, Number(req.user.sub));
    return { success: true, message: 'Lấy Farm thành công', data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateFarmDto,
  ) {
    const data = await this.farmService.updateBySeller(id, Number(req.user.sub), dto);
    return { success: true, message: 'Cập nhật Farm thành công', data };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    await this.farmService.removeBySeller(id, Number(req.user.sub));
    return { success: true, message: 'Xóa Farm thành công' };
  }
}

interface AuthenticatedRequest extends Request {
  user: { sub: number | string; email: string; role: string };
}
