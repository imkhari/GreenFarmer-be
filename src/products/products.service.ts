import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Batch } from '../batch/entities/batch.entity';
import { GetProductsDto } from './dto/get-products.dto';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { BatchImage } from '../batch/entities/batch-image.entity';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) { }

  async findAll(query: GetProductsDto) {
    const {
      search,
      categoryId,
      farmTrustLevel,
      batchTrustLevel,
      province,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    } = query;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farm', 'farm')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoin(
        (subQb) =>
          subQb
            .select('b.product_id', 'productId')
            .addSelect('MAX(b.id)', 'latestBatchId')
            .from('batches', 'b')
            .where('b.approval_status = :status', {
              status: 'Approved',
            })
            .groupBy('b.product_id'),
        'latest',
        'latest.productId = product.id',
      )
      .innerJoinAndMapOne(
        'product.latestBatch',
        Batch,
        'batch',
        'batch.id = latest.latestBatchId',
      )
      .leftJoinAndMapMany(
        'product.latestBatchImages',
        BatchImage,
        'batchImage',
        'batchImage.batch_id = batch.id',
      )
      .where('farm.status = :farmStatus', {
        farmStatus: 'approved',
      });
    if (search) {
      qb.andWhere('product.name LIKE :search', { search: `%${search}%` });
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (farmTrustLevel) {
      qb.andWhere('farm.trust_level = :farmTrustLevel', { farmTrustLevel });
    }

    if (batchTrustLevel) {
      qb.andWhere('batch.trust_level = :batchTrustLevel', { batchTrustLevel });
    }

    if (province) {
      qb.andWhere('farm.address LIKE :province', { province: `%${province}%` });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    switch (sort) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC');
        break;
      default:
        qb.orderBy('product.id', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((p: any) => this.toCardResponse(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toCardResponse(product: any) {
    const latestBatch = product.latestBatch;
    const images = product.latestBatchImages ?? [];

    const firstImage = images
      .slice()
      .sort((a, b) => a.id - b.id)[0];

    return {
      id: product.id,
      name: product.name,
      price: product.price,

      image: firstImage?.image_url ?? null,

      farmName: product.farm?.farm_name,
      farmAddress: product.farm?.address,
      farmTrustLevel: product.farm?.trust_level,
      batchTrustLevel: latestBatch?.trust_level,
      categoryName: product.category?.name,
      remainingQuantity: latestBatch?.quantity,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.farm', 'farm')
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với id ${id}`);
    }

    const currentBatch = await this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.images', 'batch_image')
      .where('batch.product_id = :id', { id })
      .andWhere('batch.approval_status = :status', {
        status: 'Approved',
      })
      .andWhere('batch.quantity > 0')
      .orderBy('batch.id', 'DESC')
      .getOne();
    const firstBatchImage = currentBatch?.images
      ?.slice()
      .sort((a, b) => a.id - b.id)[0];
    const reviewStats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.product_id = :id', { id })
      .getRawOne();
    const reviews = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.buyer', 'buyer')
      .where('review.product_id = :id', { id })
      .orderBy('review.created_at', 'DESC')
      .limit(10)
      .getMany();
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: firstBatchImage?.image_url ?? null,
      farm: product.farm
        ? {
          id: product.farm.id,
          farmName: product.farm.farm_name,
          address: product.farm.address,
          trustLevel: product.farm.trust_level,
        }
        : null,
      isFullyVerified: currentBatch?.trust_level === 'High',
      currentBatch: currentBatch
        ? {
          id: currentBatch.id,
          batchCode: currentBatch.batch_code,
          quantity: currentBatch.quantity,
          plantingDate: currentBatch.planting_date,
          harvestDate: currentBatch.harvest_date,
          trustLevel: currentBatch.trust_level,
        }
        : null,
      reviews: {
        averageRating: reviewStats?.avgRating
          ? Number(reviewStats.avgRating).toFixed(1)
          : null,
        totalReviews: Number(reviewStats?.totalReviews ?? 0),
        items: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          buyerName: r.buyer?.full_name,
          createdAt: r.created_at,
        })),
      },
    };
  }
  async createReview(buyerId: number, productId: number, dto: CreateReviewDto) {
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm với id ${producId}');
    }
    const existing = await this.reviewRepo.findOne({
      where: { product: { id: productId }, buyer: { id: buyerId } },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
    }

    const review = this.reviewRepo.create({
      product: { id: productId } as any,
      buyer: { id: buyerId } as any,
      rating: dto.rating,
      comment: dto.comment,
    });

    await this.reviewRepo.save(review);
    return { message: 'Đánh giá của bạn đã được ghi nhận' };
  }
}