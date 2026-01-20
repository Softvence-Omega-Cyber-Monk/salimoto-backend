// src/module/category/category.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/module/prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Create category
  async createCategory(name: string , image: string) {
    const existing = await this.prisma.client.category.findUnique({
      where: { name: name },
    });
    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    const category = await this.prisma.client.category.create({
      data: {
        name: name,
        image: image,
      },
    });

    return category;
  }

  // Get all categories
  async getAllCategories() {
    return this.prisma.client.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Delete category
  async deleteCategory(id: string) {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Optional: check if any duas are linked (prevent orphaned relations)
    // const duaCount = await this.prisma.client.dua.count({
    //   where: { categoryId: id },
    // });

    // if (duaCount > 0) {
    //   throw new BadRequestException(
    //     'Cannot delete category with associated duas',
    //   );
    // }

    await this.prisma.client.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}