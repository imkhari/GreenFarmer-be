import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { FarmService } from '../farm.service';
import { QueryFarmDto } from '../dto/query-farm.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admin/farms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class FarmAdminController { // Đảm bảo đã có từ khóa export ở đây
  constructor(private readonly farmService: FarmService) { }

  @Get()
  async findAll(@Query() query: QueryFarmDto) {
    const data = await this.farmService.findAllAdmin(query);

    return {
      success: true,
      message: 'Lấy danh sách Farm thành công',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.farmService.findOne(id);

    return {
      success: true,
      message: 'Lấy thông tin Farm thành công',
      data,
    };
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number) {
    const data = await this.farmService.approve(id);

    return {
      success: true,
      message: 'Duyệt Farm thành công',
      data,
    };
  }

  @Patch(':id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
  ) {
    const data = await this.farmService.reject(id, note);

    return {
      success: true,
      message: 'Từ chối Farm thành công',
      data,
    };
  }
}