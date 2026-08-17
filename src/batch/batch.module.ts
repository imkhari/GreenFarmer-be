import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './entities/batch.entity'; 
import { BatchImage } from './entities/batch-image.entity';
import { CultivationLog } from './entities/cultivation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, BatchImage, CultivationLog])], 
  controllers: [BatchController],
  providers: [BatchService],
  exports: [TypeOrmModule], 
})
export class BatchModule {}