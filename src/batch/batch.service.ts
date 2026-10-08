import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Batch, TrustLevel } from './entities/batch.entity';
import { Product } from 'src/products/entities/product.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { ApprovalStatus } from './entities/batch.entity';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async findByCode(batchCode: string) {
    const batch = await this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('product.farm', 'farm')
      .leftJoinAndSelect('batch.images', 'images')
      .leftJoinAndSelect('batch.cultivationLogs', 'logs')
      .where('batch.batch_code = :batchCode', { batchCode })
      .orderBy('logs.log_date', 'ASC')
      .getOne();

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng với mã ${batchCode}`);
    }

    return {
      batchCode: batch.batch_code,
      plantingDate: batch.planting_date,
      harvestDate: batch.harvest_date,
      quantity: batch.quantity,
      trustLevel: batch.trust_level,
      isFullyVerified: batch.trust_level === 'High',
      productName: batch.product?.name,
      farm: batch.product?.farm
        ? {
          farmName: batch.product.farm.farm_name,
          address: batch.product.farm.address,
        }
        : null,
      cultivationLogs: (batch.cultivationLogs ?? []).map((log) => ({
        id: log.id,
        activity: log.activity,
        description: log.description,
        logDate: log.log_date,
      })),
      images: (batch.images ?? []).map((img) => img.image_url),
    };
  }
   async findOne(id: number): Promise<Batch> {
    const batch = await this.batchRepo.findOne({
      where: {
        id,
      },
      relations: {
        product: {
          farm: true,
        },
        cultivationLogs: true,
        images: true,
        approvals: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy lô hàng #${id}`,
      );
    }

    return batch;
  }
   async update(
    id: number,
    updateBatchDto: UpdateBatchDto,
  ): Promise<Batch> {
    const batch = await this.findOne(id);

    if (updateBatchDto.plantingDate !== undefined) {
      batch.planting_date = new Date(
        updateBatchDto.plantingDate,
      );
    }

    if (updateBatchDto.harvestDate !== undefined) {
      batch.harvest_date = new Date(
        updateBatchDto.harvestDate,
      );
    }

    if (updateBatchDto.quantity !== undefined) {
      batch.quantity = updateBatchDto.quantity;
    }

    if (
      batch.planting_date &&
      batch.harvest_date &&
      batch.harvest_date < batch.planting_date
    ) {
      throw new BadRequestException(
        'Ngày thu hoạch phải sau hoặc bằng ngày gieo',
      );
    }

    await this.batchRepo.save(batch);

    return this.findOne(id);
  }
  //seller
  async create(dto: CreateBatchDto): Promise<Batch> {
    const product = await this.productRepository.findOne({
      where: {
        id: dto.productId,
      },
      relations: {
        farm: {
          seller: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm #${dto.productId}`,
      );
    }

    if (!product.farm) {
      throw new BadRequestException(
        'Sản phẩm chưa thuộc nông trại nào',
      );
    }

    if (product.farm.seller?.id !== dto.sellerId) {
      throw new ForbiddenException(
        'Sản phẩm này không thuộc nông trại của bạn',
      );
    }

    if (
      dto.plantingDate &&
      new Date(dto.harvestDate) < new Date(dto.plantingDate)
    ) {
      throw new BadRequestException(
        'Ngày thu hoạch phải sau hoặc bằng ngày gieo',
      );
    }

    // Tạo batch
    const batch = new Batch();

    batch.batch_code = `BATCH-${Date.now()}`;
    batch.barcode = `QR-${Date.now()}`;

    batch.planting_date = dto.plantingDate
      ? new Date(dto.plantingDate)
      : null;

    batch.harvest_date = new Date(dto.harvestDate);
    batch.quantity = dto.quantity;
    batch.product = product;
    batch.trust_level = TrustLevel.LOW;
    batch.approval_status = ApprovalStatus.PENDING;

    const savedBatch = await this.batchRepo.save(batch);

    return this.findOne(savedBatch.id);
  }
  async updateBySeller(
  id: number,
  sellerId: number,
  updateBatchDto: UpdateBatchDto,
): Promise<Batch> {
  const batch = await this.findOneBySeller(id, sellerId);

  if (updateBatchDto.plantingDate !== undefined) {
    batch.planting_date = new Date(updateBatchDto.plantingDate);
  }

  if (updateBatchDto.harvestDate !== undefined) {
    batch.harvest_date = new Date(updateBatchDto.harvestDate);
  }

  if (updateBatchDto.quantity !== undefined) {
    batch.quantity = updateBatchDto.quantity;
  }

  if (
    batch.planting_date &&
    batch.harvest_date &&
    batch.harvest_date < batch.planting_date
  ) {
    throw new BadRequestException(
      'Ngày thu hoạch phải sau hoặc bằng ngày gieo',
    );
  }

  await this.batchRepo.save(batch);

  return this.findOneBySeller(id, sellerId);
}

  findAllBySeller(sellerId: number): Promise<Batch[]> {
    return this.batchRepo.find({
      where: {
        product: {
          farm: {
            seller: { id: sellerId, }
          },
        },
      },
      relations: {
        product: {
          farm: true,
        },
        images: true,
        cultivationLogs: true,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }
  async findOneBySeller(
    id: number,
    sellerId: number,
  ): Promise<Batch> {
    const batch = await this.batchRepo.findOne({
      where: {
        id,
        product: {
          farm: {
            seller: {
              id: sellerId,
            },
          },
        },
      },
      relations: {
        product: {
          farm: true,
        },
        cultivationLogs: true,
        images: true,
        approvals: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy lô hàng #${id} hoặc lô hàng không thuộc quyền sở hữu của bạn`,
      );
    }

    return batch;
  }

  async findByBarcodeForTrace(code: string): Promise<Batch> {
    const batch = await this.batchRepo.findOne({
      where: {
        barcode: code,
        // approval_status: ApprovalStatus.APPROVED,
      },
      relations: {
        product: {
          farm: true,
        },
        cultivationLogs: true,
        images: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        'Không tìm thấy lô hàng hoặc lô chưa được xác minh',
      );
    }

    return batch;
  }
 async removeBySeller(
  id: number,
  sellerId: number,
) {
  const batch = await this.findOneBySeller(id, sellerId);

  await this.batchRepo.remove(batch);

  return {
    message: `Đã xóa lô hàng #${id}`,
  };
}

  //Admin
  async findAllAdmin(): Promise<Batch[]> {
    return this.batchRepo.find({
      relations: {
        product: {
          farm: true,
        },
        images: true,
        cultivationLogs: true,
        approvals: true,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async approve(id: number): Promise<Batch> {
    const batch = await this.batchRepo.findOneBy({ id });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng #${id}`);
    }

    batch.approval_status = ApprovalStatus.APPROVED;

    return this.batchRepo.save(batch);
  }

  async reject(id: number): Promise<Batch> {
    const batch = await this.batchRepo.findOneBy({ id });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng #${id}`);
    }

    batch.approval_status = ApprovalStatus.REJECTED;

    return this.batchRepo.save(batch);
  }

}
