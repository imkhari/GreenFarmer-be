import {
    BadRequestException,
    Controller,
    Post,
    Param,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";


@Controller("api/upload")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("seller")
export class UploadController {

    constructor(
        private readonly uploadService:
            UploadService,
    ) {}

    @Post("batch/:batchId")
    @UseInterceptors(
        FileInterceptor("file"),
    )
    async uploadImage(
        @Param("batchId")
        batchId: string,

        @UploadedFile()
        file: Express.Multer.File,
    ) {

        if (!file) {
            throw new BadRequestException(
                "Không tìm thấy file tải lên",
            );
        }

        const result =
            await this.uploadService.uploadFile(
                file,
                Number(batchId),
            );

        return {
            success: true,

            message:
                "Upload ảnh thành công",

            data: result,
        };
    }
}