import { Product } from "src/products/entities/product.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { FarmImage } from "./farm-image.entity";
export enum FarmTrustLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}
export enum FarmStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
@Entity('farms')
export class Farm {
    @PrimaryGeneratedColumn()
    id!: number;
    @Column()
    farm_name!: string;
    @Column({ nullable: true })
    owner_name!: string;

    @Column({ type: 'text', nullable: true })
    address!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    area_ha!: number;
    @Column({ nullable: true })
    farming_method!: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude!: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude!: number;
    @Column({
        type: 'enum',
        enum: FarmTrustLevel,
        name: 'trust_level',
        default: FarmTrustLevel.LOW,
    })
    trust_level!: FarmTrustLevel;

    @Column({
        type: 'enum',
        enum: FarmStatus,
        default: FarmStatus.PENDING,
    })
    status!: FarmStatus;

    @ManyToOne(() => User, (user) => user.farm)
    @JoinColumn({ name: 'seller_id' })
    seller!: User;

    @OneToMany(() => Product, (product) => product.farm)
    products!: Product[];
    @OneToMany(() => FarmImage, (image) => image.farm)
    images!: FarmImage[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
