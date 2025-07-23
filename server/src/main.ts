import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins - allows dynamic IP detection
  app.enableCors({
    origin: true, // Accept all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3001);
}

// Only run bootstrap if this file is executed directly (not imported)
if (require.main === module) {
  bootstrap();
}
