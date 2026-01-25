import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { CreateDuaDto } from './dto/createDua.dto';
import { PrismaService } from '../prisma/prisma.service';
import { parseJsonField, validateTranslationField } from './utils/jsonParse';
import { S3Service } from '../s3/s3.service';
import { UpdateDuaDto } from './dto/updateDua.dto';
import { GetAllDuasDto } from './dto/getAllDuas.dto';


@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private s3Service: S3Service) { }

  async createDua(
    audio: Express.Multer.File,
    dua: string,
    categories: string[] | string | undefined,
    english: any,
    french: any,
    arabic: any,
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

    // --- Parse JSON fields safely ---
    const parseJsonField = (input: any): Record<string, any> | null => {
      if (!input) return null;
      if (typeof input === 'object') return input;
      if (typeof input === 'string') {
        try {
          return JSON.parse(input);
        } catch {
          throw new BadRequestException(`Invalid JSON format in input`);
        }
      }
      return null;
    };

    const englishObj = parseJsonField(english);
    const frenchObj = parseJsonField(french);
    const arabicObj = parseJsonField(arabic);

    // --- Validate each translation object ---
    if (englishObj) validateTranslationField(englishObj, 'English');
    if (frenchObj) validateTranslationField(frenchObj, 'French');
    if (arabicObj) validateTranslationField(arabicObj, 'Arabic');

    // Ensure at least one translation is provided (optional but recommended)
    if (!englishObj || !frenchObj || !arabicObj) {
      throw new BadRequestException(' (english, french, or arabic) is required');
    }

    const audioUrl = await this.s3Service.uploadAudio(audio);

    // --- Create Dua ---
    const duaResult = await this.prisma.client.dua.create({
      data: {
        dua,
        audio: audioUrl,
        english: englishObj || undefined,
        french: frenchObj || undefined,
        arabic: arabicObj || undefined,
        categories: {
          connect: categoryIds.map(id => ({ id })),
        },
      },
      include: {
        categories: true,
      },
    });

    return duaResult;
  }


  async updateDua(
    id: string,
    dto: UpdateDuaDto,
    audio?: Express.Multer.File, // optional
  ) {
    // 1. Check if Dua exists
    const existingDua = await this.prisma.client.dua.findUnique({
      where: { id },
    });
    if (!existingDua) {
      throw new BadRequestException(`Dua with ID ${id} not found`);
    }

    // 2. Handle categories
    let categoryIds: string[] = [];
    const categoryArray = dto.categories ? (Array.isArray(dto.categories) ? dto.categories : [dto.categories]) : [];
    if (categoryArray.length > 0) {
      const foundCategories = await this.prisma.client.category.findMany({
        where: { name: { in: categoryArray } },
        select: { id: true },
      });

      if (foundCategories.length !== categoryArray.length) {
        const missing = categoryArray.filter(
          id => !foundCategories.some(c => c.id === id),
        );
        throw new BadRequestException(`Categories not found: ${missing.join(', ')}`);
      }
      categoryIds = foundCategories.map(c => c.id);
    }

    // 3. Parse & validate translations
    const englishObj = dto.english ? parseJsonField(dto.english) : null;
    const frenchObj = dto.french ? parseJsonField(dto.french) : null;
    const arabicObj = dto.arabic ? parseJsonField(dto.arabic) : null;

    if (englishObj) validateTranslationField(englishObj, 'English');
    if (frenchObj) validateTranslationField(frenchObj, 'French');
    if (arabicObj) validateTranslationField(arabicObj, 'Arabic');

    // 4. Handle audio (optional)
    let audioUrl = existingDua.audio;
    if (audio) {
      // Upload new audio
      audioUrl = await this.s3Service.uploadAudio(audio);

      // Delete old audio (if exists and different)
      if (existingDua.audio) {
        try {
          await this.s3Service.deleteFile(existingDua.audio);
        } catch (err) {
          // Log but don't fail the whole operation
          console.log('Failed to delete the old audio from s3:', err.message);
        }
      }
    }

    // 5. Build update payload
    const updateData: any = {
      dua: dto.dua ?? existingDua.dua,
      audio: audioUrl,
      english: englishObj !== null ? englishObj : existingDua.english,
      french: frenchObj !== null ? frenchObj : existingDua.french,
      arabic: arabicObj !== null ? arabicObj : existingDua.arabic,
    };

    // Only update categories if provided
    if (dto.categories !== undefined) {
      updateData.categories = {
        set: categoryIds.map(id => ({ id })),
      };
    }

    // 6. Perform update
    const updatedDua = await this.prisma.client.dua.update({
      where: { id },
      data: updateData,
      include: { categories: true },
    });

    return updatedDua;
  }

  async getAllDuas(query: GetAllDuasDto) {
    const { category, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (category) {
      where.categories = {
        some: {
          name: category,
        },
      };
    }

    // Fetch total count for pagination metadata
    const total = await this.prisma.client.dua.count({ where });

    // Fetch data
    const duas = await this.prisma.client.dua.findMany({
      where,
      skip,
      take: limit,
      include: {
        categories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: duas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

}
