import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { User } from "src/users/entities/user.entity";

@Entity('reviews')
export class Review{
    @PrimaryGeneratedColumn()
    id!:number;
    @Column()
    rating!: number;
    @Column({type: 'text', nullable: true})
    comment!: string;
    @ManyToOne(() => Product, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'product_id'})
    product!: Product;
    @ManyToOne(() => User)
    @JoinColumn({name: 'buyer_id'})
    buyer!: User;
    @CreateDateColumn()
    created_at!: Date;
}