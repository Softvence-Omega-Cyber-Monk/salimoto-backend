import { BadGatewayException, Injectable } from '@nestjs/common';
import { CreateDuaDto } from './dto/createDua.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

  async createDua(createDuaDto: CreateDuaDto , audioUrl:string) {
    const {  arabic, languages, categoryIds } = createDuaDto;

    // Optional: validate category IDs exist
    const existingCategories = await this.prisma.client.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    if (existingCategories.length !== categoryIds.length) {
      throw new BadGatewayException('One or more category IDs are invalid');
    }

    return this.prisma.client.dua.create({
      data: {
        audio: audioUrl,
        arabic,
        languages: {
          create: languages.map((lang) => ({
            name: lang.name,
            content: lang.content,
            title: lang.title,
            duaReference: lang.duaReference,
          })),
        },
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
      include: {
        languages: true,
        categories: true,
      },
    });
  }
}
