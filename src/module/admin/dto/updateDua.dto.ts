// dto/updateDua.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDuaDto {
  @ApiPropertyOptional({
    example: 'اللَّهُمَّ بِكَ أَصْبَحْنَا...',
    description: 'The Arabic text of the dua',
  })
  @IsOptional()
  @IsString()
  dua?: string;

  @ApiPropertyOptional({
    example: ['Morning', 'Protection'],
    description: 'Array of category names to associate with this dua',
  })
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'English translation as a JSON object or string',
    example: '{"title":"Morning Supplication","content":"O Allah...","duaReference":"Abu Dawud 5068"}',
  })
  @IsOptional()
  english?: Record<string, any> | string;

  @ApiPropertyOptional({
    description: 'French translation as a JSON object or string',
    example: '{"title":"Supplication du matin","content":"Ô Allah...","duaReference":"Abu Dawud 5068"}',
  })
  @IsOptional()
  french?: Record<string, any> | string;

  @ApiPropertyOptional({
    description: 'Arabic translation as a JSON object or string',
    example: '{"title":"دعاء الصباح","content":"اللهم بك أصبحنا...","duaReference":"أبو داود 5068"}',
  })
  @IsOptional()
  arabic?: Record<string, any> | string;
}