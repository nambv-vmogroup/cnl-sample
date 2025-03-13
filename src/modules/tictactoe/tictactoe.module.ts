import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './entities/game.entity';
import { TictactoeGateway } from './tictactoe.gateway';
import { TictactoeService } from './tictactoe.service';
import { RedisModule } from '../../common/redis/redis.module';
import { TictactoeController } from './tictactoe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity]), RedisModule],
  providers: [TictactoeGateway, TictactoeService],
  controllers: [TictactoeController],
  exports: [TictactoeService, TictactoeGateway],
})
export class TictactoeModule {}
