import { PartialType } from '@nestjs/mapped-types';
import { CreateCultivationLogDto } from './create-cultivation-log.dto';

export class UpdateCultivationLogDto extends PartialType(CreateCultivationLogDto) {}