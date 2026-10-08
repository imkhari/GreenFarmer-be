import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
  MaxLength,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateFarmDto {
@IsOptional()
@Type(() => Number)
  @IsNotEmpty()
  seller_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  farm_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  owner_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area_ha?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  farming_method?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;
}
