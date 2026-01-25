// video.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Res,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { VideoService } from './video.service';
import sendResponse from 'src/utils/sendResponse';
import { CreateVideoDto } from './dto/ate-video.dto';
import { UpdateVideoDto } from './dto/date-video.dto';
import { GetVideosDto } from './dto/get-videos.dto';

@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) { }

  @Post('create-video')
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



  @Patch('update/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'New Title' },
        presenterName: { type: 'string', example: 'New Presenter' },
        video: {
          type: 'string',
          format: 'binary',
          description: 'New video file (optional)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'New thumbnail image (optional)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Update a video and/or thumbnail' })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  async updateVideo(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @Res() res: Response,
    @UploadedFiles()
    uploadedFiles?: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    try {
      // Extract single files from arrays
      const video = uploadedFiles?.video?.[0];
      const thumbnail = uploadedFiles?.thumbnail?.[0];
      const result = await this.videoService.updateVideo(id, dto, video, thumbnail);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Video updated successfully',
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all videos with optional search and pagination' })
  @ApiResponse({ status: 200, description: 'Videos retrieved successfully' })
  async getAllVideos(@Query() query: GetVideosDto, @Res() res: Response) {
    try {
      const result = await this.videoService.getAllVideos(query);

      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Videos retrieved successfully',
        data: result.data,
      });
    } catch (error) {
      throw error;
    }
  }
}