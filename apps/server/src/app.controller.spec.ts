import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = appController.getHello();
      expect(result).toBe('Hello World!');
    });

    it('should call appService.getHello()', () => {
      const spy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      expect(spy).toHaveBeenCalled();
    });

    it('should return the same value as appService.getHello()', () => {
      const serviceResult = appService.getHello();
      const controllerResult = appController.getHello();
      expect(controllerResult).toBe(serviceResult);
    });

    it('should return a string', () => {
      const result = appController.getHello();
      expect(typeof result).toBe('string');
    });

    it('should not be empty', () => {
      const result = appController.getHello();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
