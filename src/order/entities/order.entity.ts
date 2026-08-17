import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { OrderDetail } from './order-detail.entity';

export enum OrderStatus {
    PENDING = 'Pending',
    CONFIRMED = 'Confirmed',
    PREPARING = 'Preparing',
    SHIPPING = 'Shipping',
    DELIVERED = 'Delivered',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
}
export enum PaymentMethod {
    COD = 'COD',
    VNPAY = 'VNPay',
    MOMO = 'Momo',
    ZALOPAY = 'ZaloPay',

}

export enum PaymentStatus {
    UNPAID = 'Unpaid',
    PAID = 'Paid',
    FAILED = 'Failed',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    buyer_id!: number;

    @Column({ length: 100 })
    receiver_name!: string;

    @Column({ length: 20 })
    receiver_phone!: string;

    @Column('text')
    shipping_address!: string;

    @Column('float')
    total_price!: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status!: OrderStatus;
    @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
    payment_method!: PaymentMethod;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
    payment_status!: PaymentStatus;
    @Column({length: 50, nullable: true })
    app_trans_id!: string;
    
    @Column('text', { nullable: true })
    tracking_note!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'buyer_id' })
    buyer!: User;

    @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
    details!: OrderDetail[];

    @CreateDateColumn()
    created_at!: Date;
}