import { Controller, Get, Param } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('code/:batchCode')
  findByCode(@Param('batchCode') batchCode: string) {
    return this.batchService.findByCode(batchCode);
  }
}