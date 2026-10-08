import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm, FarmStatus } from './entities/farm.entity';
import { FindOptionsRelations, Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { QueryFarmDto } from './dto/query-farm.dto';

@Injectable()
export class FarmService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }
  async findAll(query: QueryFarmDto = {}) {
    const {
      seller_id,
      page = 1,
      limit = 10,
      search,
      status,
    } = query;

    const qb = this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .leftJoinAndSelect('farm.seller', 'seller');

    if (status) {
      qb.andWhere('farm.status = :status', { status });
    } else {
      qb.andWhere('farm.status = :status', {
        status: FarmStatus.APPROVED,
      });
    }

    // Lọc theo seller nếu có
    if (seller_id !== undefined) {
      qb.andWhere('farm.seller_id = :sellerId', {
        sellerId: seller_id,
      });
    }

    // Tìm kiếm
    if (search) {
      qb.andWhere(
        '(farm.farm_name LIKE :search OR farm.address LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    qb.orderBy('farm.created_at', 'DESC');

    const [farms, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = farms.map((farm) => {
      const firstImage = (farm.images ?? [])
        .filter((img) => img.image_type === 'Farm')
        .sort((a, b) => a.id - b.id)[0];

      return {
        id: farm.id,
        farm_name: farm.farm_name,
        address: farm.address,
        description: farm.description,
        image: firstImage?.image_url ?? null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const farm = await this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .leftJoinAndSelect('farm.products', 'products')
      .where('farm.id = :id', { id })
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
  async create(dto: CreateFarmDto): Promise<Farm> {
    const seller = await this.findSellerEntity(dto.seller_id);

    const farm = this.farmRepo.create({
      ...dto,
      seller,
      owner_name: seller.full_name,
      status: FarmStatus.PENDING,
    });

    return this.farmRepo.save(farm);
  }

  async findAllAdmin(query: QueryFarmDto = {}) {
    const {
      seller_id,
      page = 1,
      limit = 10,
      search,
      status,
    } = query;

    const qb = this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .leftJoinAndSelect('farm.seller', 'seller');

    // Admin mặc định xem tất cả trạng thái.
    // Chỉ lọc trạng thái khi admin truyền status.
    if (status) {
      qb.andWhere('farm.status = :status', { status });
    }

    if (seller_id !== undefined) {
      qb.andWhere('farm.seller_id = :sellerId', {
        sellerId: seller_id,
      });
    }

    if (search?.trim()) {
      qb.andWhere(
        '(farm.farm_name LIKE :search OR farm.address LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    qb.orderBy('farm.created_at', 'DESC');

    const [farms, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = farms.map((farm) => {
      const firstImage = (farm.images ?? [])
        .filter((img) => img.image_type === 'Farm')
        .sort((a, b) => a.id - b.id)[0];

      return {
        id: farm.id,
        farm_name: farm.farm_name,
        address: farm.address,
        description: farm.description,
        status: farm.status,
        image: firstImage?.image_url ?? null,
        seller_id: farm.seller?.id ?? null,
        area_ha: farm.area_ha != null ? Number(farm.area_ha) : null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async findAllBySeller(sellerId: number, query: QueryFarmDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
    } = query;

    const qb = this.farmRepo
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.images', 'images')
      .leftJoinAndSelect('farm.seller', 'seller')
      .where('farm.seller_id = :sellerId', { sellerId });
    if (status) {
      qb.andWhere('farm.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(farm.farm_name LIKE :search OR farm.address LIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('farm.created_at', 'DESC');

    const [farms, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = farms.map((farm) => {
      const firstImage = (farm.images ?? [])
        .filter((img) => img.image_type === 'Farm')
        .sort((a, b) => a.id - b.id)[0];

      return {
        id: farm.id,
        farm_name: farm.farm_name,
        address: farm.address,
        description: farm.description,
        status: farm.status,
        image: firstImage?.image_url ?? null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async findOneBySeller(id: number, sellerId: number): Promise<Farm> {
    const farm = await this.findFarmEntity(id, {
      relations: { images: true },
    });
    this.ensureFarmOwnership(farm, sellerId);
    return farm;
  }

  async updateBySeller(
    id: number,
    sellerId: number,
    dto: UpdateFarmDto,
  ): Promise<Farm> {
    const farm = await this.findOneBySeller(id, sellerId);
    Object.assign(farm, dto);
    return this.farmRepo.save(farm);
  }

  async removeBySeller(id: number, sellerId: number): Promise<void> {
    const farm = await this.findOneBySeller(id, sellerId);
    await this.farmRepo.remove(farm);
  }

  async approve(id: number): Promise<Farm> {
    return this.setStatus(id, FarmStatus.APPROVED);
  }

  async reject(id: number, note?: string): Promise<Farm> {
    // Nếu bạn có cột lưu note từ chối, có thể xử lý gắn vào đây
    return this.setStatus(id, FarmStatus.REJECTED);
  }

  // =========================
  // PRIVATE HELPERS
  // =========================

  private async findFarmEntity(
    id: number,
    options?: { relations?: FindOptionsRelations<Farm> },
  ): Promise<Farm> {
    const farm = await this.farmRepo.findOne({
      where: { id },
      relations: {
        seller: true,
        ...options?.relations,
      }
    });

    if (!farm) {
      throw new NotFoundException('Không tìm thấy Farm');
    }
    return farm;
  }

  private ensureFarmOwnership(farm: Farm, sellerId: number,): void {
    if (farm.seller?.id !== sellerId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập Farm này',
      );
    }
  }

  private async findSellerEntity(sellerId: number): Promise<User> {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Không tìm thấy Seller');
    }
    if (seller.role !== UserRole.SELLER) {
      throw new ConflictException('User này không phải Seller');
    }
    return seller;
  }

  private async setStatus(id: number, status: FarmStatus): Promise<Farm> {
    const farm = await this.findFarmEntity(id);
    farm.status = status;
    return this.farmRepo.save(farm);
  }
}
