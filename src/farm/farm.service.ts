import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FarmService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
  ) { }
  async findAll() {
    const farms = await this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .where('farm.status = :status', { status: 'approved' })
      .getMany();

    return farms.map((farm) => {
      const firstImage = (farm.images ?? [])
        .filter((img) => img.image_type === 'Farm')
        .sort((a, b) => a.id - b.id)[0];

      return {
        id: farm.id,
        farm_name: farm.farm_name,
        address: farm.address,
        description: farm.description,

        image: firstImage?.image_url
          ? `http://localhost:3000/uploads/${firstImage.image_url.replace(/^\/+/, '')}`
          : null,
      };
    });
  }

  async findOne(id: number) {
    const farm = await this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .leftJoinAndSelect('farm.products', 'products')
      .where('farm.id = :id', { id })
      .andWhere('farm.status = :status', { status: 'approved' })
      .getOne();

    if (!farm) {
      throw new NotFoundException(`Không tìm thấy nông trại với id ${id}`);
    }

    return {
      id: farm.id,
      farmName: farm.farm_name,
      ownerName: farm.owner_name,
      address: farm.address,
      description: farm.description,
      areaHa: farm.area_ha,
      farmingMethod: farm.farming_method,
      trustLevel: farm.trust_level,
      images: (farm.images ?? []).map((img) => img.image_url),
      totalProducts: farm.products?.length ?? 0,
    };
  }

}
