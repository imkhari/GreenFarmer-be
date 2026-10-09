import { Controller, Get, Param, Post, Patch, Delete, Body, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { UserRole } from 'src/common/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number | string;
    email: string;
    role: string;
  };
}
@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) { }

  @Get('code/:batchCode')
  findByCode(@Param('batchCode') batchCode: string) {
    return this.batchService.findByCode(batchCode);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.batchService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  create(@Body() createBatchDto: CreateBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.create({
      ...createBatchDto,
      sellerId: Number(req.user.sub),
    });
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findAllBySeller(@Req() req: AuthenticatedRequest) {
    return this.batchService.findAllBySeller(Number(req.user.sub));
  }

  @Get('trace/:code')
  trace(@Param('code') code: string) {
    return this.batchService.findByBarcodeForTrace(code);
  }
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findMine(@Req() req: AuthenticatedRequest) {
    return this.batchService.findAllBySeller(Number(req.user.sub));
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.findOneBySeller(
      id,
      Number(req.user.sub),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.updateBySeller(
      id,
      Number(req.user.sub),
      updateBatchDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.removeBySeller(
      id,
      Number(req.user.sub),
    );
  }
}