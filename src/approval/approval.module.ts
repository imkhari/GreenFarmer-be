import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { Approval } from './entities/approval.entity';
import { Batch } from '../batch/entities/batch.entity';
import { User } from '../users/entities/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Approval, Batch,User])],
  controllers: [ApprovalController],
  providers: [ApprovalService],
})
export class ApprovalModule {}