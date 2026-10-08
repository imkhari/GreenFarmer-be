import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { BatchImage } from './batch-image.entity';
import { Approval } from 'src/approval/entities/approval.entity';
import { CultivationLog } from 'src/cultivation-logs/entities/cultivation-log.entity';

export enum TrustLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'batch_code', unique: true })
  batch_code!: string;

  @Column({ name: 'planting_date', type: 'date', nullable: true })
  planting_date!: Date | null;

  @Column({ name: 'harvest_date', type: 'date', nullable: true })
  harvest_date!: Date;
  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'barcode', unique: true })
  barcode!: string;

  @Column({ type: 'enum', enum: TrustLevel, name: 'trust_level', default: TrustLevel.LOW })
  trust_level!: TrustLevel;

  @Column({ type: 'enum', enum: ApprovalStatus, name: 'approval_status', default: ApprovalStatus.PENDING })
  approval_status!: ApprovalStatus;

  @ManyToOne(() => Product, (product) => product.batches)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
  @OneToMany(() => BatchImage, (image) => image.batch)
  images!: BatchImage[];

  @OneToMany(() => CultivationLog, (log) => log.batch)
  cultivationLogs!: CultivationLog[];
  @OneToMany(() => Approval, (approval) => approval.batch)
  approvals!: Approval[];

  @CreateDateColumn()
  created_at!: Date;
}