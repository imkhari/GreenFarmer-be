import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CultivationLogsController } from './cultivation-logs.controller';
import { CultivationLogsService } from './cultivation-logs.service';
import { CultivationLog } from './entities/cultivation-log.entity';
import { Batch } from 'src/batch/entities/batch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CultivationLog, Batch])],
  controllers: [CultivationLogsController],
  providers: [CultivationLogsService],
  exports: [CultivationLogsService],
})
export class CultivationLogsModule {}