// video.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateVideoDto } from './dto/ate-video.dto';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async createVideo(
    videoFile: Express.Multer.File,
    dto: CreateVideoDto,
  ) {
    if (!videoFile) {
      throw new InternalServerErrorException('Video file is required');
    }

    // Upload video
    const videoUrl = await this.s3Service.uploadVideo(videoFile);

    // Generate & upload thumbnail
    let thumbnailUrl: string | null = null;
    try {
      const thumbnailPath = await this.s3Service.generateThumbnail(
        videoFile.buffer,
        videoFile.originalname,
      );
      thumbnailUrl = await this.s3Service.uploadThumbnail(thumbnailPath);
    } catch (error) {
      // Log but don't fail — thumbnail is optional
      console.warn('Thumbnail generation failed:', error.message);
    }

    // Save to DB
    const video = await this.prisma.client.video.create({
      data: {
        title: dto.title,
        videoUrl,
        thumbnailImage: thumbnailUrl, // can be null
        presenterName: dto.presenterName,
        views: 0,
        likes: 0,
      },
    });

    return video;
  }
}