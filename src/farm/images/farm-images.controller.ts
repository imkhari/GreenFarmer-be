import {
  Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors,
  Body, BadRequestException, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { FarmImageService } from './farm-image.service';
import { CreateFarmImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('seller/farms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class FarmImageController {
  constructor(private readonly service: FarmImageService) {}

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async upload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFarmImageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên (Key: image)');
    }
    return this.service.upload(id, file, dto.image_type, Number(req.user.sub));
  }

  @Get(':id/images')
  findImages(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.findByFarm(id, Number(req.user.sub));
  }

  @Delete('images/:imageId')
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.service.delete(imageId, Number(req.user.sub));
    return { success: true, message: 'Xóa ảnh thành công' };
  }
}

interface AuthenticatedRequest extends Request {
  user: { sub: number | string; email: string; role: string };
}
