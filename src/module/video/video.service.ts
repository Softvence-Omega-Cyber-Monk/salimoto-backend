// video.service.ts
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateVideoDto } from './dto/ate-video.dto';
import { UpdateVideoDto } from './dto/date-video.dto';
import { Upload } from '@aws-sdk/lib-storage';
import { GetVideosDto } from './dto/get-videos.dto';

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

   async updateVideo(
    id: string,
    dto: UpdateVideoDto,
    newVideoFile?: Express.Multer.File,
    newThumbnailFile?: Express.Multer.File,
  ) {
    // 1. Check if video exists
    const existingVideo = await this.prisma.client.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      throw new BadRequestException(`Video with ID ${id} not found`);
    }

    // console.log('📹 Video file:', newVideoFile?.originalname || 'undefined');
    // console.log('🖼️ Thumbnail file:', newThumbnailFile?.originalname || 'undefined');
    // 2. Prepare update data
    const updateData: any = {};
    let newVideoUrl: string | undefined;
    let newThumbnailUrl: string | undefined;

    // --- Handle new video upload ---
    if (newVideoFile) {
      newVideoUrl = await this.s3Service.uploadVideo(newVideoFile);
      // Delete old video (if exists and different)
      if (existingVideo.videoUrl) {
        try {
          await this.s3Service.deleteFile(existingVideo.videoUrl);
        } catch (err) {
          console.warn('Failed to delete old video:', err.message);
        }
      }
      updateData.videoUrl = newVideoUrl;
    }

    // --- Handle new thumbnail upload ---
    if (newThumbnailFile) {
      // Validate image type
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedImageTypes.includes(newThumbnailFile.mimetype)) {
        throw new BadRequestException('Invalid thumbnail image type. Use JPEG or PNG.');
      }

      const fileExtension = newThumbnailFile.originalname.split('.').pop();
      const key = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
      const bucket = this.s3Service['configService'].get<string>('AWS_S3_BUCKET');
      const region = this.s3Service['configService'].get<string>('AWS_REGION');

      try {
        const parallelUpload = new Upload({
          client: this.s3Service['s3Client'],
          params: {
            Bucket: bucket!,
            Key: key,
            Body: newThumbnailFile.buffer,
            ContentType: newThumbnailFile.mimetype,
          },
        });
        await parallelUpload.done();
        newThumbnailUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

        // Delete old thumbnail
        if (existingVideo.thumbnailImage) {
          try {
            await this.s3Service.deleteFile(existingVideo.thumbnailImage);
          } catch (err) {
            console.warn('Failed to delete old thumbnail:', err.message);
          }
        }
        updateData.thumbnailImage = newThumbnailUrl;
      } catch (error) {
        throw new InternalServerErrorException('Failed to upload new thumbnail');
      }
    }

    // --- Update metadata ---
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.presenterName !== undefined) updateData.presenterName = dto.presenterName;

    // 3. Perform update
    const updatedVideo = await this.prisma.client.video.update({
      where: { id },
      data: updateData,
    });

    return updatedVideo;
  }


  async getAllVideos(query: GetVideosDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { presenterName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.client.video.count({ where });

    // Fetch videos
    const videos = await this.prisma.client.video.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: videos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
