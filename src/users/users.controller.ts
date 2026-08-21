import { Controller, Get, Put, Body, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly uploadService:
            UploadService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.sub);
    return {
      success: true,
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateData: {
    full_name?: string;
    phone?: string;
    address?: string;
  },) {
    const updatedUser = await this.usersService.updateProfile(req.user.sub, updateData);
    return {
      success: true,
      message: 'Cập nhật thành công',
      data: updatedUser,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post("profile/avatar")
  @UseInterceptors(
    FileInterceptor("file"),
  )
  async uploadAvatar(
    @Request() req,
    @UploadedFile()
    file: Express.Multer.File,
  ) {

    if (!file) {
      throw new BadRequestException(
        "Vui lòng chọn ảnh",
      );
    }

    // Upload lên Cloudinary
    const result =
      await this.uploadService.uploadAvatar(file);

    const updatedUser =
      await this.usersService.updateAvatar(
        req.user.sub,
        result.secure_url,
      );

    return {
      success: true,
      message:
        "Cập nhật ảnh đại diện thành công",
      data: updatedUser,
    };
  }
}