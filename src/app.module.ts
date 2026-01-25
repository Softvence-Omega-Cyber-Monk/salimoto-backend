import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './module/prisma/prisma.module';
import { AdminModule } from './module/admin/amdmin.module';
import { CategoryModule } from './module/category/category.module';
import { S3Module } from './module/s3/s3.module';
import { VideoModule } from './module/video/video.module';
import { VideoService } from './module/video/video.service';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
    PrismaModule,
    AdminModule,
    CategoryModule,
    S3Module,
    VideoModule
  ],
  controllers: [AppController],
  providers: [AppService, VideoService],
})
export class AppModule { }
