import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './module/prisma/prisma.module';
import { AmdminModule } from './module/admin/amdmin.module';
import { CategoryModule } from './module/category/category.module';
import { S3Module } from './module/s3/s3.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
    PrismaModule,
    AmdminModule,
    CategoryModule,
    S3Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
