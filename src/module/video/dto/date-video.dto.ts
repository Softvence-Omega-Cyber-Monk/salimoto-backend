import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVideoDto {
  @ApiPropertyOptional({ example: 'Updated Morning Dua' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Sheikh Khalid' })
  @IsOptional()
  @IsString()
  presenterName?: string;
}