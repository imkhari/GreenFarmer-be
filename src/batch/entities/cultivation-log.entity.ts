import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Batch } from './batch.entity';

@Entity('cultivation_logs')
export class CultivationLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  activity!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  image!: string;

  @Column({ type: 'date', nullable: true })
  log_date!: Date;

  @ManyToOne(() => Batch, (batch) => batch.cultivationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;
}