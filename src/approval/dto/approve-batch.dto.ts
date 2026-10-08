import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TrustLevel } from '../../common/enums';

export class ApproveBatchDto {
  @IsInt()
  adminId!: number;

  @IsEnum(TrustLevel)
  trustLevel!: TrustLevel;

  @IsOptional()
  @IsString()
  note?: string;
}