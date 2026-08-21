import {
    BadRequestException,
    Controller,
    Post,
    Param,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { UploadService } from "./upload.service";

@Controller("api/upload")
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