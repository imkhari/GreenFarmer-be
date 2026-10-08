import { Batch } from 'src/batch/entities/batch.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('cultivation_logs')
export class CultivationLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  batch_id!: number;

  @Column()
  activity!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image!: string | null;

  @Column({ type: 'date', nullable: true })
  log_date!: Date | null;

  @ManyToOne(() => Batch, (batch) => batch.cultivationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch!: Batch;
}