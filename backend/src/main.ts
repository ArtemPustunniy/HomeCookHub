import { join } from 'node:path'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import hbs = require('hbs')
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ElapsedTimeInterceptor } from './common/interceptors/elapsed-time.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })
  const viewsDir = join(__dirname, 'views')
  app.setBaseViewsDir(viewsDir)
  app.setViewEngine('hbs')
  hbs.registerPartials(join(viewsDir, 'partials'))
  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b)
  app.enableCors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'If-None-Match'],
    exposedHeaders: ['X-Elapsed-Time', 'ETag', 'Cache-Control', 'Link', 'X-Request-Id'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ElapsedTimeInterceptor())

  const swagger = new DocumentBuilder()
    .setTitle('HomeCookHub API')
    .setDescription('REST API (NestJS). GraphQL: POST /graphql')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swagger)
  SwaggerModule.setup('api/docs', app, document)

  const config = app.get(ConfigService)
  const port = Number(config.get<string>('PORT')) || 3001
  await app.listen(port)
}

bootstrap()
