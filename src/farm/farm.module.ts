import { Module } from '@nestjs/common';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { FarmImage } from './entities/farm-image.entity';
import { User } from 'src/users/entities/user.entity';
import { FarmAdminController } from './admin/farm-admin.controller';
import { FarmSellerController } from './seller/farm-seller.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FarmImageController } from './images/farm-images.controller';
import { FarmImageService } from './images/farm-image.service';
import { UploadModule } from 'src/upload/upload.module';


@Module({
  imports: [TypeOrmModule.forFeature([Farm, FarmImage, User]), UploadModule], 
  controllers: [FarmController,
    FarmAdminController,
    FarmSellerController,
    FarmImageController
  ],
  providers: [FarmService, JwtAuthGuard, 
    RolesGuard, FarmImageService],
  exports: [TypeOrmModule],
})
export class FarmModule {}