import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('route handling', () => {
    it('should handle room/player routes', () => {
      const mockResponse = {
        sendFile: jest.fn(),
      };
      
      appController.serveClientApp('test-room', 'test-player', mockResponse as any);
      
      expect(mockResponse.sendFile).toHaveBeenCalled();
    });

    it('should handle fallback routes', () => {
      const mockResponse = {
        sendFile: jest.fn(),
      };
      
      appController.serveApp(mockResponse as any);
      
      expect(mockResponse.sendFile).toHaveBeenCalled();
    });
  });
});
