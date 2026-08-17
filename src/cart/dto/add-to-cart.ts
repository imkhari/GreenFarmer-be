import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @Type(() => Number)
  @IsInt()
  batchId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}