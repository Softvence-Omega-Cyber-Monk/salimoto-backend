import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { CreateDuaDto } from './dto/createDua.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async createDua(
    arabic: string,
    audioUrl: string,
    categories: string[] | string | undefined,
    english: any,
    french: any,
    spanish: any,
  ) {
    // Convert categories to array if it's a string
    let categoriesArray: string[] = [];
    if (categories) {
      if (typeof categories === 'string') {
        categoriesArray = categories.split(',').map(c => c.trim());
      } else if (Array.isArray(categories)) {
        categoriesArray = categories;
      }
    }

    // Step 1: Validate and fetch category IDs
    let categoryIds: string[] = [];
    if (categoriesArray && categoriesArray.length > 0) {
      const foundCategories = await this.prisma.client.category.findMany({
        where: {
          name: { in: categoriesArray },
        },
        select: { id: true },
      });

      if (foundCategories.length !== categoriesArray.length) {
        const foundNames = foundCategories.map(c => c.id);
        const missing = categoriesArray.filter(name => !foundNames.includes(name));
        throw new BadRequestException(`Categories not found: ${missing.join(', ')}`);
      }

      categoryIds = foundCategories.map(c => c.id);
    }

    // Step 2: Create Dua
    const dua = await this.prisma.client.dua.create({
      data: {
        arabic,
        audio: audioUrl,
        france: french || undefined,
        english: english || undefined,
        spanish: spanish || undefined,
        categories: {
          connect: categoryIds.map(id => ({ id })),
        },
      },
      include: {
        categories: true,
      },
    });

    return dua;
  }
}
