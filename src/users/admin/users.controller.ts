import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return this.ok(data, 'Tạo User thành công');
  }

  @Get()
  async findAll(@Query() query: UserQueryDto) {
    const data = await this.usersService.findAll(query);
    return this.ok(data, 'Lấy danh sách User thành công');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return this.ok(data, 'Lấy thông tin User thành công');
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const data = await this.usersService.update(id, updateUserDto);
    return this.ok(data, 'Cập nhật User thành công');
  }

  @Patch(':id/lock')
  async lock(@Param('id', ParseIntPipe) id: number) {
    const { message } = await this.usersService.lock(id);
    return this.ok(null, message);
  }

  @Patch(':id/unlock')
  async unlock(@Param('id', ParseIntPipe) id: number) {
    const { message } = await this.usersService.unlock(id);
    return this.ok(null, message);
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    const { message } = await this.usersService.resetPassword(id, dto);
    return this.ok(null, message);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const { message } = await this.usersService.remove(id);
    return this.ok(null, message);
  }

  // ============================================================
  // Chuẩn hóa response format — dùng chung cho mọi endpoint
  // ============================================================
  private ok<T>(data: T, message: string) {
    return { success: true, message, data };
  }
}
