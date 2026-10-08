import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";

import { BatchImage } from "../batch/entities/batch-image.entity";
import { Batch } from "../batch/entities/batch.entity";

@Injectable()
export class UploadService {
    constructor(
        @InjectRepository(BatchImage)
        private readonly batchImageRepository: Repository<BatchImage>,

        @InjectRepository(Batch)
        private readonly batchRepository: Repository<Batch>,
    ) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async uploadToCloudinary(
        file: Express.Multer.File,
        folder: string,
    ) {
        if (!file) {
            throw new BadRequestException('Không tìm thấy file tải lên');
        }

        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            throw new BadRequestException('Chỉ chấp nhận file hình ảnh!');
        }

        return new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(result);
                },
            );

            streamifier
                .createReadStream(file.buffer)
                .pipe(uploadStream);
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        batchId: number,
    ) {
        if (!file) {
            throw new BadRequestException(
                "Không tìm thấy file tải lên",
            );
        }

        const batch = await this.batchRepository.findOne({
            where: {
                id: batchId,
            },
        });

        if (!batch) {
            throw new NotFoundException(
                `Không tìm thấy batch với id ${batchId}`,
            );
        }

        if (
            !file.mimetype.match(
                /\/(jpg|jpeg|png|gif|webp)$/,
            )
        ) {
            throw new BadRequestException(
                "Chỉ chấp nhận file hình ảnh!",
            );
        }

        const cloudinaryResult = await new Promise<any>(
            (resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "greenfarmer",
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                                return;
                            }

                            resolve(result);
                        },
                    );

                streamifier
                    .createReadStream(file.buffer)
                    .pipe(uploadStream);
            },
        );

        const batchImage =
            this.batchImageRepository.create({
                batch_id: batchId,
                image_url:
                    cloudinaryResult.secure_url,
            });

        const savedImage =
            await this.batchImageRepository.save(
                batchImage,
            );

        return {
            id: savedImage.id,
            batch_id: savedImage.batch_id,
            image_url: savedImage.image_url,
        };
    }

    async uploadAvatar(
        file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException(
                "Không tìm thấy file",
            );
        }

        if (
            !file.mimetype.match(
                /\/(jpg|jpeg|png|gif|webp)$/,
            )
        ) {
            throw new BadRequestException(
                "Chỉ chấp nhận file hình ảnh!",
            );
        }

        return new Promise<any>(
            (resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder:
                                "greenfarmer/avatars",
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                                return;
                            }

                            resolve(result);
                        },
                    );

                streamifier
                    .createReadStream(file.buffer)
                    .pipe(uploadStream);
            },
        );
    }
}
