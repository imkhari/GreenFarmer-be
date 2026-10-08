import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCultivationLogDto {
  @IsInt()
  batchId!: number;

  @IsString()
  @IsNotEmpty()
  activity!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsDateString()
  logDate!: string;
}