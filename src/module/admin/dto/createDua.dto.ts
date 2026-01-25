// src/module/dua/dto/create-dua.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LanguageContentDto {
  @ApiProperty({
    example: 'Súplica de la mañana',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Oh Allah, contigo entramos en la mañana...',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'Abu Dawud 5068',
    required: false,
    description: 'Hadith or source reference of the dua',
  })
  @IsOptional()
  @IsString()
  duaReference?: string;
}

export class CreateDuaDto {
  @ApiProperty({
    example: 'اللَّهُمَّ بِكَ أَصْبَحْنَا...',
  })
  @IsNotEmpty()
  @IsString()
  dua: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Audio file (mp3, wav, etc.)',
  })
  // File handled via @UploadedFile(), not declared in DTO

  @ApiProperty({
    example: ['Morning', 'Protection'],
    description: 'Array of category names to associate with this dua',
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'English translation with title and content' })
  @IsOptional()
  english?: Record<string, any>;

  @ApiPropertyOptional({ description: 'French translation with title and content' })
  @IsOptional()
  french?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Arabic translation with title and content' })
  @IsOptional()
  arabic?: Record<string, any>;
}
