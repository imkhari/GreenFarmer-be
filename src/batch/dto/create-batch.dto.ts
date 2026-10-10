import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateCultivationLogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  activity!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  logDate!: string;
}

export class CreateBatchDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sellerId!: number;

  @IsInt()
  productId!: number;

  @IsOptional()
  @IsDateString()
  plantingDate?: string;

  @IsDateString()
  harvestDate!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCultivationLogDto)
  cultivationLogs?: { activity: string; description?: string; logDate: string }[];
}