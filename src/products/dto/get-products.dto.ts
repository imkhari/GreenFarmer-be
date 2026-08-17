import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetProductsDto {
  // Tìm kiếm
  @IsOptional()
  @IsString()
  search?: string;

  // Danh mục
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  farmTrustLevel?: string;

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  batchTrustLevel?: string;

  // Khu vực
  @IsOptional()
  @IsString()
  province?: string;

  // Giá thấp nhất
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  // Giá cao nhất
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Trang
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  // Số sản phẩm/trang
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 12;

  // Sắp xếp
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort: string = 'newest';
}