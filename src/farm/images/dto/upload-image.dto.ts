import { IsEnum, IsOptional } from "class-validator";
import { FarmImageType } from "../../entities/farm-image.entity";

export class CreateFarmImageDto {
  @IsOptional()
  image: Express.Multer.File;

  @IsEnum(FarmImageType)
  @IsOptional()
  image_type!: FarmImageType;
}
