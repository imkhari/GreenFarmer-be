import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Farm } from '../../farm/entities/farm.entity';
import { Category } from '../../category/entities/category.entity';
import { Batch } from '../../batch/entities/batch.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @ManyToOne(() => Farm, (farm) => farm.products)
  @JoinColumn({ name: 'farm_id' })
  farm!: Farm;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => Batch, (batch) => batch.product)
  batches!: Batch[];
}