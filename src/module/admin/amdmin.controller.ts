import { Body, Controller, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDuaDto } from './dto/createDua.dto';
import sendResponse from 'src/utils/sendResponse';
import type { Response } from 'express';
import { AdminService } from './amdmin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { Public } from '@prisma/client/runtime/client';

@Controller('admin')
export class AdminController {

  constructor(private duaService: AdminService, private s3Service: S3Service) { }

  @UseInterceptors(FileInterceptor('audio'))
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arabic: { type: 'string', example: 'اللَّهُمَّ بِكَ أَصْبَحْنَا' },
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
        spanish: {
          type: 'object',
          description: 'Spanish translation',
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
      const audioUrl = await this.s3Service.uploadAudio(audio);

      // Pass data to service
      const result = await this.duaService.createDua(
        dto.arabic,
        audioUrl,
        dto.categories,
        dto.english,
        dto.french,
        dto.spanish,
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

}
