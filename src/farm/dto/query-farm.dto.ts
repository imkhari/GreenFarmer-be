import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FarmStatus } from '../entities/farm.entity';

export class QueryFarmDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FarmStatus)
  status?: FarmStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;
}
