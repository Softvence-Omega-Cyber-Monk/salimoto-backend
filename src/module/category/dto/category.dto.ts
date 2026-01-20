// src/module/category/dto/category.dto.ts
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Morning Duas' })
  @IsNotEmpty()
  @IsString()
  name: string;


}