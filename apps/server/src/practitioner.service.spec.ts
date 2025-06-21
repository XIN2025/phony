import { Test, TestingModule } from '@nestjs/testing';
import { PractitionerService } from './practitioner.service';

describe('PractitionerService', () => {
  let service: PractitionerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PractitionerService],
    }).compile();

    service = module.get<PractitionerService>(PractitionerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
