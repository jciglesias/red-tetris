import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should have AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it('should inject AppService into AppController', () => {
    const controller = module.get<AppController>(AppController);
    const service = module.get<AppService>(AppService);
    
    // Test that the controller can use the service
    expect(controller.getHello()).toBe(service.getHello());
  });

  describe('module compilation', () => {
    it('should compile successfully', async () => {
      const testModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      expect(testModule).toBeDefined();
      await testModule.close();
    });

    it('should create module with all dependencies', async () => {
      const testModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const controllers = testModule.get<AppController[]>(AppController);
      const services = testModule.get<AppService[]>(AppService);

      expect(controllers).toBeDefined();
      expect(services).toBeDefined();

      await testModule.close();
    });
  });
});
