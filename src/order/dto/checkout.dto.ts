import { IsArray, IsInt, IsString, ArrayNotEmpty, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Phải chọn ít nhất 1 sản phẩm để đặt hàng' })
  @Type(() => Number)
  @IsInt({ each: true })
  cartItemIds!: number[];

  @IsString()
  receiverName!: string;

  @IsString()
  receiverPhone!: string;

  @IsString()
  shippingAddress!: string;

  @IsOptional()
  @IsIn(['COD', 'VNPay','ZaloPay', 'Momo'])
  paymentMethod?: string = 'COD';
}