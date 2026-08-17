// src/category/category.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { GetCategoriesDto } from './dto/get-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@Query() query: GetCategoriesDto) {
    return this.categoryService.findAll(query);
  }
}