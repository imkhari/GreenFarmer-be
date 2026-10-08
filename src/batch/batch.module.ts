import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './entities/batch.entity'; 
import { BatchImage } from './entities/batch-image.entity';
import { Approval } from 'src/approval/entities/approval.entity';
import { CultivationLog } from 'src/cultivation-logs/entities/cultivation-log.entity';
import { Product } from 'src/products/entities/product.entity';
import { BatchAdminController } from './admin/batch-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Batch, BatchImage, CultivationLog, Approval, Product])], 
  controllers: [BatchController, BatchAdminController],
  providers: [BatchService],
  exports: [TypeOrmModule], 
})
export class BatchModule {}