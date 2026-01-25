// dto/create-video.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'Morning Dua Explanation' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Sheikh Ahmed' })
  @IsNotEmpty()
  @IsString()
  presenterName: string;

  // Note: video file is handled via @UploadedFile(), not in DTO
}