import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Batch } from "./batch.entity";

@Entity('batch_images')
export class BatchImage {
    @PrimaryGeneratedColumn()
    id!: number;
    @Column()
    image_url!: string;

    @ManyToOne(() => Batch, (batch) => batch.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'batch_id' })
    batch!: Batch;
}