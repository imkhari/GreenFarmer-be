import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

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
}