import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RejectBatchDto {
  @IsInt()
  adminId!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}