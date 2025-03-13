import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Query, 
  UsePipes, 
  ValidationPipe,
  ParseIntPipe,
  ParseUUIDPipe
} from '@nestjs/common';
import { TictactoeService } from './tictactoe.service';
import {
  CreateGameDto,
  JoinGameDto,
  MoveDto,
  GameStateDto,
} from './dtos/game.dto';

@Controller('tictactoe')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TictactoeController {
  constructor(private readonly tictactoeService: TictactoeService) {}

  @Post('games')
  async createGame(
    @Body() createGameDto: CreateGameDto,
  ): Promise<GameStateDto> {
    return this.tictactoeService.createGame(createGameDto);
  }

  @Post('games/join')
  async joinGame(@Body() joinGameDto: JoinGameDto): Promise<GameStateDto> {
    return this.tictactoeService.joinGame(joinGameDto);
  }

  @Get('games/completed')
  async getCompletedGames(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<GameStateDto[]> {
    return this.tictactoeService.getCompletedGames(limit || 10);
  }

  @Get('games/:id')
  async getGameState(
    @Param('id', ParseUUIDPipe) gameId: string
  ): Promise<GameStateDto> {
    return this.tictactoeService.getGameState(gameId);
  }

  @Post('games/:id/moves')
  async makeMove(
    @Param('id', ParseUUIDPipe) gameId: string,
    @Body() moveDto: MoveDto,
  ): Promise<GameStateDto> {
    // Set the gameId from the URL parameter
    moveDto.gameId = gameId;
    return this.tictactoeService.makeMove(moveDto);
  }

  @Get('players/:id/stats')
  async getPlayerStats(@Param('id') playerId: string) {
    return this.tictactoeService.getPlayerStats(playerId);
  }
}
