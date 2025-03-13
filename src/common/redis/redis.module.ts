import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule } from 'src/config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
