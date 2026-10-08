import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Batch } from '../../batch/entities/batch.entity';
import { User } from '../../users/entities/user.entity';
import { ApprovalDecisionStatus } from '../../common/enums';

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'batch_id' })
  batchId!: number;

  @ManyToOne(() => Batch, (batch) => batch.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;

  @Column({ name: 'admin_id' })
  adminId!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin!: User;

  @Column({ type: 'enum', enum: ApprovalDecisionStatus })
  status!: ApprovalDecisionStatus;

  // Khớp cột 'note' trong DB thật (không phải 'reason')
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  // Khớp cột 'approved_at' — thời điểm admin ra quyết định
  @CreateDateColumn({ name: 'approved_at' })
  approvedAt!: Date;
}