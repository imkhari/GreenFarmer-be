import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { GetCategoriesDto } from './dto/get-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(query: GetCategoriesDto) {
    const qb = this.categoryRepo.createQueryBuilder('category');

    if (query.search) {
      qb.where('category.name LIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('category.name', 'ASC');

    return qb.getMany();
  }
}