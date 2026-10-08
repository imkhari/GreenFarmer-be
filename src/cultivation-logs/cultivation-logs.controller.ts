import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,
  Query, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CultivationLogsService } from './cultivation-logs.service';
import { CreateCultivationLogDto } from './dto/create-cultivation-log.dto';
import { UpdateCultivationLogDto } from './dto/update-cultivation-log.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';

@Controller('cultivation-logs')
export class CultivationLogsController {
  constructor(private readonly logsService: CultivationLogsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post()
  create(@Body() dto: CreateCultivationLogDto, @Req() req: AuthenticatedRequest) {
    return this.logsService.create(dto, Number(req.user.sub));
  }

  @Get()
  findAllByBatch(@Query('batchId', ParseIntPipe) batchId: number) {
    return this.logsService.findAllByBatch(batchId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.logsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCultivationLogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.logsService.update(id, dto, Number(req.user.sub));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.logsService.remove(id, Number(req.user.sub));
  }
}

interface AuthenticatedRequest extends Request {
  user: { sub: number | string; email: string; role: string };
}
