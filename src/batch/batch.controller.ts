import {
  Controller, Get, Param, Post, Patch, Delete, Body, ParseIntPipe,
  UseGuards, Req, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { UserRole } from 'src/common/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadService } from 'src/upload/upload.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number | string;
    email: string;
    role: string;
  };
}

class AddLogDto {
  @IsNotEmpty() @IsString() log_date!: string;
  @IsNotEmpty() @IsString() activity!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
}

@Controller('batches')
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly uploadService: UploadService,
  ) { }

  @Get('code/:batchCode')
  findByCode(@Param('batchCode') batchCode: string) {
    return this.batchService.findByCode(batchCode);
  }

  @Get('trace/:code')
  trace(@Param('code') code: string) {
    return this.batchService.findByBarcodeForTrace(code);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  create(@Body() createBatchDto: CreateBatchDto, @Req() req: AuthenticatedRequest) {
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

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.batchService.findOneBySeller(id, Number(req.user.sub));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.updateBySeller(id, Number(req.user.sub), updateBatchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.batchService.removeBySeller(id, Number(req.user.sub));
  }

  @Post(':id/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  addLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddLogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.addLog(id, Number(req.user.sub), dto);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ) {
    // Kiểm tra quyền sở hữu lô trước khi upload
    await this.batchService.findOneBySeller(id, Number(req.user.sub));
    if (!files?.length) throw new BadRequestException('Vui lòng chọn ảnh');
    return Promise.all(files.map((f) => this.uploadService.uploadFile(f, id)));
  }
}