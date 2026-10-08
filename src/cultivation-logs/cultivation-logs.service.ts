import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CultivationLog } from './entities/cultivation-log.entity';
import { CreateCultivationLogDto } from './dto/create-cultivation-log.dto';
import { UpdateCultivationLogDto } from './dto/update-cultivation-log.dto';
import { Batch } from '../batch/entities/batch.entity';

@Injectable()
export class CultivationLogsService {
  constructor(
    @InjectRepository(CultivationLog)
    private readonly logRepository: Repository<CultivationLog>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
  ) {}

  async create(dto: CreateCultivationLogDto, sellerId?: number) {
    await this.ensureBatchOwnership(dto.batchId, sellerId);

    const log = this.logRepository.create({
      batch_id: dto.batchId,
      activity: dto.activity,
      description: dto.description ?? null,
      image: dto.image ?? null,
      log_date: dto.logDate ? new Date(dto.logDate) : null,
    });

    return this.logRepository.save(log);
  }

  findAllByBatch(batchId: number) {
    return this.logRepository.find({
      where: { batch_id: batchId },
      order: { log_date: 'ASC' },
    });
  }

  async findOne(id: number) {
    const log = await this.logRepository.findOne({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Không tìm thấy nhật ký #${id}`);
    }

    return log;
  }

  async update(id: number, dto: UpdateCultivationLogDto, sellerId?: number) {
    const log = await this.findOne(id);
    await this.ensureBatchOwnership(log.batch_id, sellerId);

    if (dto.batchId !== undefined) {
      await this.ensureBatchOwnership(dto.batchId, sellerId);
      log.batch_id = dto.batchId;
    }

    if (dto.activity !== undefined) log.activity = dto.activity;
    if (dto.description !== undefined) log.description = dto.description;
    if (dto.image !== undefined) log.image = dto.image;
    if (dto.logDate !== undefined) log.log_date = new Date(dto.logDate);

    return this.logRepository.save(log);
  }

  async remove(id: number, sellerId?: number) {
    const log = await this.findOne(id);
    await this.ensureBatchOwnership(log.batch_id, sellerId);
    return this.logRepository.remove(log);
  }

  private async ensureBatchOwnership(batchId: number, sellerId?: number) {
    if (sellerId === undefined) return;

    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: {
        product: {
          farm: { seller: true },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng #${batchId}`);
    }

    if (batch.product?.farm?.seller?.id !== sellerId) {
      throw new ForbiddenException('Bạn không có quyền thao tác với lô hàng này');
    }
  }
}
