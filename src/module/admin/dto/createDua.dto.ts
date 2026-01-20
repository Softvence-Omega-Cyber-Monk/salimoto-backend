// dua.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum LanguageEnum {
  ENGLISH = 'ENGLISH',
  FRANCE = 'FRANCE',
  SPANISH = 'SPANISH',
}

class CreateLanguageDto {
  @ApiProperty({ enum: LanguageEnum, example: 'ENGLISH' })
  @IsEnum(LanguageEnum)
  name: LanguageEnum;

  @ApiProperty({ example: 'O Allah, forgive me.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Forgiveness Dua' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Forgiveness Dua' })
  @IsString()
  @IsNotEmpty()
  duaReference: string;
}

export class CreateDuaDto {
  // ❌ REMOVE THIS FIELD
  // audioFile: any;

  @ApiProperty({ example: 'اللهم اغفر لي' })
  @IsString()
  @IsNotEmpty()
  arabic: string;

  @ApiProperty({ type: [CreateLanguageDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateLanguageDto)
  languages: CreateLanguageDto[];

  @ApiProperty({
    example: ['r51423h2jlk', '2afdafdf'],
    description: 'Array of existing category IDs to associate with the dua',
  })
  @IsArray()
  @IsNotEmpty()
  categoryIds: string[];
}