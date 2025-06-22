import { Test, TestingModule } from '@nestjs/testing';
import { PractitionerController } from './practitioner.controller';
import { PractitionerService } from './practitioner.service';

describe('PractitionerController', () => {
  let controller: PractitionerController;

  const mockPractitionerService = {
    sendInvitation: jest.fn(),
    getClients: jest.fn(),
    getIntakeForms: jest.fn(),
    createIntakeForm: jest.fn(),
    getIntakeForm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PractitionerController],
      providers: [
        {
          provide: PractitionerService,
          useValue: mockPractitionerService,
        },
      ],
    }).compile();

    controller = module.get<PractitionerController>(PractitionerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
