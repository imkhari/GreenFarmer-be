import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FarmImage,
  FarmImageType,
} from '../entities/farm-image.entity';
import { Farm } from '../entities/farm.entity';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class FarmImageService {
  constructor(
    @InjectRepository(FarmImage)
    private imageRepo: Repository<FarmImage>,

    @InjectRepository(Farm)
    private farmRepo: Repository<Farm>,

    private readonly uploadService: UploadService,
  ) {}

  async upload(
    farmId: number,
    file: Express.Multer.File,
    type: FarmImageType,
    sellerId?: number,
  ) {
    // 1. Kiểm tra Farm + quyền sở hữu
    const farm = await this.getFarmForSeller(
      farmId,
      sellerId,
    );

    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file ảnh',
      );
    }

    // 3. Upload ảnh lên Cloudinary
    const result =
      await this.uploadService.uploadToCloudinary(
        file,
        'greenfarmer/farms',
      );

    // 4. Lưu URL Cloudinary vào DB
    const image = this.imageRepo.create({
      farm,
      image_url: result.secure_url,
      image_type: type,
    });

    return this.imageRepo.save(image);
  }

  async findByFarm(
    farmId: number,
    sellerId?: number,
  ) {
    await this.getFarmForSeller(
      farmId,
      sellerId,
    );

    return this.imageRepo.find({
      where: {
        farm: { id: farmId },
      },
    });
  }

  async delete(
    imageId: number,
    sellerId?: number,
  ) {
    const image = await this.imageRepo.findOne({
      where: { id: imageId },
      relations: {
        farm: {
          seller: true,
        },
      },
    });

    if (!image) {
      throw new NotFoundException(
        'Ảnh không tồn tại',
      );
    }

    if (
      sellerId !== undefined &&
      image.farm?.seller?.id !== sellerId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa ảnh này',
      );
    }

    return this.imageRepo.remove(image);
  }

  private async getFarmForSeller(
    farmId: number,
    sellerId?: number,
  ) {
    const farm = await this.farmRepo.findOne({
      where: { id: farmId },
      relations: {
        seller: true,
      },
    });

    if (!farm) {
      throw new NotFoundException(
        'Farm không tồn tại',
      );
    }

    if (
      sellerId !== undefined &&
      farm.seller?.id !== sellerId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác Farm này',
      );
    }

    return farm;
  }
}