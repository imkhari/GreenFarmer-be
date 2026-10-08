import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Farm } from './farm.entity';

export enum FarmImageType {
  FARM = 'Farm',
  CERTIFICATE = 'Certifi',
}
@Entity('farm_images')
export class FarmImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  image_url!: string;

  @Column({
    type: 'enum',
    enum: FarmImageType,
  })
  image_type!: FarmImageType;

  @ManyToOne(() => Farm, (farm) => farm.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm!: Farm;

  @CreateDateColumn()
  created_at!: Date;
}