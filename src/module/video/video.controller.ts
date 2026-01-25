// video.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { VideoService } from './video.service';
import sendResponse from 'src/utils/sendResponse';
import { CreateVideoDto } from './dto/ate-video.dto';

@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Video file and metadata',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (mp4, mov, avi, mkv, webm, ogg)',
        },
        title: {
          type: 'string',
          example: 'Morning Dua Explanation',
        },
        presenterName: {
          type: 'string',
          example: 'Sheikh Ahmed',
        },
      },
      required: ['video', 'title', 'presenterName'],
    },
  })
  @ApiOperation({ summary: 'Upload a new video with auto-generated thumbnail' })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadVideo(
    @Body() dto: CreateVideoDto,
    @UploadedFile() video: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const result = await this.videoService.createVideo(video, dto);

      return sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Video uploaded successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }
}