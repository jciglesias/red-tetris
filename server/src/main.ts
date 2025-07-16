import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}

// Only run bootstrap if this file is executed directly (not imported)
if (require.main === module) {
  bootstrap();
}
