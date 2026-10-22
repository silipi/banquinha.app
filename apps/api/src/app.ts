import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

const lowerFirst = (value: string) =>
  value.charAt(0).toLowerCase() + value.slice(1);
const upperFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Creates the app with global config. Shared by the server, tests and OpenAPI generation. */
export async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ['error', 'warn', 'log'] },
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}

export function buildOpenApiDocument(app: NestFastifyApplication) {
  const config = new DocumentBuilder()
    .setTitle('vendeu.store API')
    .setVersion('0.1.0')
    .build();

  return SwaggerModule.createDocument(app, config, {
    // StoresController.checkHandle -> "storesCheckHandle", which becomes the client function name.
    operationIdFactory: (controllerKey, methodKey) =>
      lowerFirst(controllerKey.replace(/Controller$/, '')) +
      upperFirst(methodKey),
  });
}
