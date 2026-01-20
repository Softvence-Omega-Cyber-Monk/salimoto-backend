import { Test, TestingModule } from '@nestjs/testing';
import { AmdminService } from './amdmin.service';

describe('AmdminService', () => {
  let service: AmdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmdminService],
    }).compile();

    service = module.get<AmdminService>(AmdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
