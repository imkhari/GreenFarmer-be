import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchImage } from 'src/batch/entities/batch-image.entity';
import { Batch } from 'src/batch/entities/batch.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Batch, BatchImage])],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule { }