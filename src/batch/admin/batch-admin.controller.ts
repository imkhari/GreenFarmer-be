import {
Controller,
Get,
Param,
ParseIntPipe,
Patch,
UseGuards,
} from '@nestjs/common';

import { BatchService } from '../batch.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('admin/batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BatchAdminController {
constructor(private readonly batchService: BatchService) {}

@Get()
findAll() {
return this.batchService.findAllAdmin();
}

@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
return this.batchService.findOne(id);
}

@Patch(':id/approve')
approve(@Param('id', ParseIntPipe) id: number) {
return this.batchService.approve(id);
}

@Patch(':id/reject')
reject(@Param('id', ParseIntPipe) id: number) {
return this.batchService.reject(id);
}
}
