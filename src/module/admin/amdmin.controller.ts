import { Body, Controller, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDuaDto } from './dto/createDua.dto';
import sendResponse from 'src/utils/sendResponse';
import type { Response } from 'express';
import { AdminService } from './amdmin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';

@Controller('admin')
export class AdminController {

  constructor(private duaService: AdminService, private s3Service: S3Service) { }

  @Post()
@UseInterceptors(FileInterceptor('audioFile'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      arabic: { type: 'string', example: 'اللهم اغفر لي' },
      languages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: ['ENGLISH', 'FRANCE', 'SPANISH'] },
            content: { type: 'string', example: 'O Allah, forgive me.' },
            title: { type: 'string', example: 'Forgiveness Dua' },
            duaReference: { type: 'string', example: 'Surah Al-Baqarah' },
          },
        },
      },
      categoryIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['cat1', 'cat2'],
      },
      audioFile: {
        type: 'string',
        format: 'binary',
        description: 'Optional audio file (MP3, WAV, OGG)',
      },
    },
    required: ['arabic', 'languages', 'categoryIds'], // audioFile is optional
  },
})
@ApiOperation({ summary: 'Create a new Dua with translations, categories, and optional audio' })
@ApiResponse({ status: 201, description: 'Dua created successfully' })
@ApiResponse({
  status: 400,
  description: 'Bad Request - Invalid input, category IDs, or file type',
})
async createDua(
  @Body() createDuaDto: CreateDuaDto,
  @UploadedFile() audioFile: Express.Multer.File,
  @Res() res: Response,
) {
  let audioUrl: string | undefined;

  if (audioFile) {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-wav'];
    if (!allowedTypes.includes(audioFile.mimetype)) {
      return sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: 'Invalid audio file type. Only MP3, WAV, and OGG are allowed.',
        data: null,
      });
    }

    try {
      audioUrl = await this.s3Service.uploadFile(audioFile, 'duas/audio');
    } catch (error) {
      return sendResponse(res, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to upload audio file',
        data: null,
      });
    }
  }

  const data = await this.duaService.createDua(createDuaDto, audioUrl as string);
  return sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: 'Dua created successfully',
    data,
  });
}
}
