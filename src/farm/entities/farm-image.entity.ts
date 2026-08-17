import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Farm } from './farm.entity';

@Entity('farm_images')
export class FarmImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_url' })
  imageUrl!: string;

    @Column({
    name: 'image_type',
    type: 'enum',
    enum: ['Farm','Certifi'], 
  })
  imageType!: string;

  @ManyToOne(() => Farm, (farm) => farm.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm!: Farm;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}