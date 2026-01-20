import { Module } from '@nestjs/common';
import { AdminService } from './amdmin.service';
import { AdminController } from './amdmin.controller';

@Module({
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule {}