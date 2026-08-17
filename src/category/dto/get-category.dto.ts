// src/category/dto/get-categories.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class GetCategoriesDto {
  @IsOptional()
  @IsString()
  search?: string; // phòng khi sau này cần tìm kiếm danh mục trong trang admin
}