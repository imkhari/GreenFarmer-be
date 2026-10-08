import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalStatus, Batch } from '../batch/entities/batch.entity';
import { Approval } from './entities/approval.entity';
import { ApproveBatchDto } from './dto/approve-batch.dto';
import { RejectBatchDto } from './dto/reject-batch.dto';
import { BatchApprovalStatus, ApprovalDecisionStatus } from '../common/enums/index';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(Approval)
    private readonly approvalRepository: Repository<Approval>,
  ) {}

  async findAll(): Promise<Batch[]> {
    return this.batchRepository.find({
      relations: { product: { farm: true }, cultivationLogs: true, images: true, approvals: true },
      order: { created_at: 'DESC' },
    });
  }

  // Danh sách lô hàng đang chờ duyệt
  async findPending(): Promise<Batch[]> {
    return this.batchRepository.find({
      where: { approval_status: ApprovalStatus.PENDING },
      relations: { product: { farm: true }, cultivationLogs: true, images: true, approvals: true },
      order: { created_at: 'ASC' },
    });
  }

  // Chi tiết 1 lô hàng — dùng để admin xem checklist trước khi quyết định
  async findOne(batchId: number): Promise<Batch> {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: { product: { farm: true }, cultivationLogs: true, images: true, approvals: true },
    });
    if (!batch) {
      throw new NotFoundException(`Không tìm thấy lô hàng #${batchId}`);
    }
    return batch;
  }

  async approve(batchId: number, dto: ApproveBatchDto): Promise<Batch> {
    const batch = await this.findOne(batchId);

    if (batch.approval_status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Lô hàng #${batchId} đã được xử lý trước đó (trạng thái hiện tại: ${batch.approval_status})`,
      );
    }

    batch.approval_status = ApprovalStatus.APPROVED;
    batch.trust_level = dto.trustLevel;
    if (!batch.barcode) {
      batch.barcode = this.generateBarcode(batch.batch_code);
    }

    await this.batchRepository.save(batch);

    await this.approvalRepository.save(
      this.approvalRepository.create({
        batchId,
        adminId: dto.adminId,
        status: ApprovalDecisionStatus.APPROVED,
        note: dto.note ?? null,
      }),
    );

    return this.findOne(batchId);
  }

  // Sinh mã theo format GF-QR-{batchCode}-{8 ký tự ngẫu nhiên}, khớp mẫu dữ liệu đã có sẵn trong DB
  private generateBarcode(batchCode: string): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `GF-QR-${batchCode}-${random}`;
  }

  async reject(batchId: number, dto: RejectBatchDto): Promise<Batch> {
    const batch = await this.findOne(batchId);

    if (batch.approval_status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Lô hàng #${batchId} đã được xử lý trước đó (trạng thái hiện tại: ${batch.approval_status})`,
      );
    }

    batch.approval_status = ApprovalStatus.REJECTED;
    await this.batchRepository.save(batch);

    await this.approvalRepository.save(
      this.approvalRepository.create({
        batchId,
        adminId: dto.adminId,
        status: ApprovalDecisionStatus.REJECTED,
        note: dto.reason,
      }),
    );

    return this.findOne(batchId);
  }
}