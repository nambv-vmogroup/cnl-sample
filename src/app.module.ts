import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CatModule } from './modules/cat/cat.module';
import { typeOrmConfig } from './config/typeorm.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ExceptionsFilterFilter } from './common/filters/exceptions-filter.filter';

@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    TypeOrmModule.forRoot(typeOrmConfig as TypeOrmModuleOptions),
    CatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor
    },
    {
      provide: 'APP_FILTER',
      useClass: ExceptionsFilterFilter,
    },
    {
      provide: 'APP_PIPE',
      useClass: ValidationPipe,
    }
  ],
})
export class AppModule {}
