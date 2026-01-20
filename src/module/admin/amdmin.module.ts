import { Module } from '@nestjs/common';
import { AmdminService } from './amdmin.service';
import { AmdminController } from './amdmin.controller';

@Module({
  providers: [AmdminService],
  controllers: [AmdminController]
})
export class AmdminModule {}
