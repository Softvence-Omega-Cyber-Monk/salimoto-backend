import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDuaDto } from './dto/createDua.dto';
import sendResponse from 'src/utils/sendResponse';
import type { Response } from 'express';
import { AdminService } from './amdmin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { Public } from '@prisma/client/runtime/client';
import { UpdateDuaDto } from './dto/updateDua.dto';
import { GetAllDuasDto } from './dto/getAllDuas.dto';

@Controller('admin')
export class AdminController {

  constructor(private duaService: AdminService) { }

  @UseInterceptors(FileInterceptor('audio'))
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dua: { type: 'string', example: 'اللَّهُمَّ بِكَ أَصْبَحْنَا' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          example: ['Morning', 'Evening'],
        },
        english: {
          type: 'object',
          description: 'English translation',
        },
        french: {
          type: 'object',
          description: 'French translation',
        },
        arabic: {
          type: 'object',
          description: 'Arabic translation',
        },
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (mp3, wav, etc.)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new Dua with audio and translations' })
  @ApiResponse({ status: 201, description: 'Dua created successfully' })
  async createDua(
    @Body() dto: CreateDuaDto,
    @UploadedFile() audio: Express.Multer.File,
    @Res() res: Response,
  ) {



    if (!audio) {
      return sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: 'Audio file is required',
        data: null,
      });
    }

    try {
      // Upload audio to S3

      // Pass data to service
      const result = await this.duaService.createDua(
        audio,
        dto.dua,
        dto.categories,
        dto.english,
        dto.french,
        dto.arabic,
      );

      return sendResponse(res, {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Dua created successfully',
        data: result,
      });
    } catch (error) {
      throw error; // Let global filter handle it, or customize here
    }
  }


  @UseInterceptors(FileInterceptor('audio'))
  @Patch('dua/:id')
  @ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Update a Dua (all fields optional). Send translations as JSON strings.',
  schema: {
    type: 'object',
    properties: {
      dua: {
        type: 'string',
        example: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
      },
      categories: {
        type: 'array',
        items: { type: 'string' },
        example: ['Morning'],
      },
      english: {
        type: 'string',
        description: 'JSON string of English translation',
        example: '{"title":"Morning Supplication","content":"O Allah...","duaReference":"Abu Dawud 5068"}',
      },
      french: {
        type: 'string',
        description: 'JSON string of French translation',
        example: '{"title":"Supplication du matin","content":"Ô Allah...","duaReference":"Abu Dawud 5068"}',
      },
      arabic: {
        type: 'string',
        description: 'JSON string of Arabic translation',
        example: '{"title":"دعاء الصباح","content":"اللهم بك أصبحنا...","duaReference":"أبو داود 5068"}',
      },
      audio: {
        type: 'string',
        format: 'binary',
        description: 'Audio file (optional)',
      },
    },
    // No "required" → all optional
  },
}) @ApiOperation({ summary: 'Update a Dua by ID (partial update)' })
  @ApiResponse({ status: 200, description: 'Dua updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Dua not found' })
  async updateDua(
    @Param('id') id: string,
    @Body() dto: UpdateDuaDto,
    @UploadedFile() audio: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const result = await this.duaService.updateDua(id, dto, audio);

      return sendResponse(res, {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Dua updated successfully',
        data: result,
      });
    } catch (error) {
      // Let global exception filter handle it, or customize
      throw error;
    }
  }


  @Get('duas')
  @ApiOperation({ summary: 'Get all duas with optional category filter and pagination' })
  @ApiResponse({ status: 200, description: 'List of duas retrieved successfully' })
  async getAllDuas(@Query() query: GetAllDuasDto, @Res() res: Response) {
    try {
      const result = await this.duaService.getAllDuas(query);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Duas retrieved successfully',
        data: result.data,
      });
    } catch (error) {
      throw error;
    }
  }

}
