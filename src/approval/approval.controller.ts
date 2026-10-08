import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApproveBatchDto } from './dto/approve-batch.dto';
import { RejectBatchDto } from './dto/reject-batch.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('approval')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  findPending() {
    return this.approvalService.findPending();
  }

  @Get()
  findAll() {
    return this.approvalService.findAll();
  }

  @Get(':batchId')
  findOne(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.approvalService.findOne(batchId);
  }

  @Post(':batchId/approve')
  approve(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() dto: ApproveBatchDto,
  ) {
    return this.approvalService.approve(batchId, dto);
  }

  @Post(':batchId/reject')
  reject(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() dto: RejectBatchDto,
  ) {
    return this.approvalService.reject(batchId, dto);
  }
}
