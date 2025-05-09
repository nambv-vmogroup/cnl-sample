import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  app.enableCors();
  app.useWebSocketAdapter(new WsAdapter(app));
  
  await app.listen(port);
  Logger.log(`Application is running on port: ${port}`);
}

bootstrap();
