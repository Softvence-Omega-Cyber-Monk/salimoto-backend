// src/module/category/category.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/category.dto';
import { Response } from 'express';
import sendResponse from 'src/utils/sendResponse';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { S3Service } from '../s3/s3.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private s3Service: S3Service,
  ) { }

  // Create category (Admin only)
  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Morning Duas' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, png, etc.)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new category with image upload' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() image: Express.Multer.File,
    @Res() res: Response,
  ) {
    // Optional: Validate file presence
    if (!image) {
      return sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: 'Image file is required',
        data: null,
      });
    }

    try {
      // Upload to S3
      const imageUrl = await this.s3Service.uploadFile(image, 'categories');

      // Pass name + S3 URL to service
      const result = await this.categoryService.createCategory(
        dto.name,
        imageUrl, // now a real S3 URL
      );

      return sendResponse(res, {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Category created successfully',
        data: result,
      });
    } catch (error) {
      // S3Service already throws InternalServerErrorException on failure
      throw error;
    }
  }
  // Get all categories (Public)
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getAllCategories(@Res() res: Response) {
    const data = await this.categoryService.getAllCategories();
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Categories fetched successfully',
      data,
    });
  }

  // Delete category (Admin only)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id') id: string, @Res() res: Response) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return sendResponse(res, {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: 'Invalid category ID',
        data: null,
      });
    }

    const result = await this.categoryService.deleteCategory(parsedId);
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
}