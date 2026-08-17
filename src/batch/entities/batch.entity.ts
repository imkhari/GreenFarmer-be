import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { BatchImage } from './batch-image.entity';
import { CultivationLog } from './cultivation-log.entity';

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
  planting_date!: Date;

  @Column({ name: 'harvest_date', type: 'date', nullable: true })
  harvest_date!: Date;

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
  quantity: any;

}