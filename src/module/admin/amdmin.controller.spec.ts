import { Test, TestingModule } from '@nestjs/testing';
import { AmdminController } from './amdmin.controller';

describe('AmdminController', () => {
  let controller: AmdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmdminController],
    }).compile();

    controller = module.get<AmdminController>(AmdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
