import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GameEntity, BoardState } from './entities/game.entity';
import { RedisService } from '../../common/redis/redis.service';
import {
  CreateGameDto,
  JoinGameDto,
  MoveDto,
  GameStateDto,
} from './dtos/game.dto';
import {
  EGAME_PLAYER,
  EGAME_STATUS,
  GAME_REDIS_PREFIX,
  GAME_TTL,
} from '../../config/constants';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TictactoeService {
  constructor(
    @InjectRepository(GameEntity)
    private gameRepository: Repository<GameEntity>,
    private redisService: RedisService,
  ) {}
  /**
   * Create a new game
   */
  async createGame(createGameDto: CreateGameDto, playWithBot = true): Promise<GameStateDto> {
    const { playerName } = createGameDto;

    // Initialize game state
    const gameId = uuidv4();

    const botPlayer =  {
      playerName: 'BOT',
      playerId: EGAME_PLAYER.O
    }

    const gameState: GameStateDto = {
      id: gameId,
      board: [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
      playerX: playerName,
      currentPlayer: EGAME_PLAYER.X,
      status: EGAME_STATUS.WAITING_FOR_OPPONENT
    };

    // bot alway make a first move
    if (playWithBot) {
      gameState.playerO = botPlayer.playerName;
      gameState.status = EGAME_STATUS.IN_PROGRESS;
      // Bot makes the first move
      const botMove = this.makeBotMove(gameState.board);
      if (botMove) {
        gameState.board[botMove.row][botMove.col] = botPlayer.playerId;
      }
    }


    // Store in Redis
    await this.redisService.set(
      `${GAME_REDIS_PREFIX}:${gameId}`,
      gameState,
      GAME_TTL,
    );

    return gameState;
  }

  /**
   * Join an existing game
   */
  async joinGame(joinGameDto: JoinGameDto): Promise<GameStateDto> {
    const { gameId, playerName } = joinGameDto;

    // Get game from Redis
    const gameState = await this.redisService.get<GameStateDto>(
      `${GAME_REDIS_PREFIX}:${gameId}`,
    );

    if (!gameState) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    // Check if the game is already full
    if (gameState.status !== EGAME_STATUS.WAITING_FOR_OPPONENT) {
      throw new BadRequestException('This game already has two players');
    }

    // Add second player
    gameState.playerO = playerName;
    gameState.status = EGAME_STATUS.IN_PROGRESS;

    // Update Redis
    await this.redisService.set(
      `${GAME_REDIS_PREFIX}:${gameId}`,
      gameState,
      GAME_TTL,
    );

    return gameState;
  }

  /**
   * Make a move in the game
   */
  async makeMove(moveDto: MoveDto): Promise<GameStateDto> {
    const { gameId, playerId, row, col } = moveDto;

    // Get game from Redis
    const gameState = await this.redisService.get<GameStateDto>(
      `${GAME_REDIS_PREFIX}:${gameId}`,
    );

    if (!gameState) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    // Validate game status
    if (gameState.status !== EGAME_STATUS.IN_PROGRESS) {
      throw new BadRequestException('This game is not in progress');
    }

    // Determine player symbol (X or O)
    const playerSymbol =
      gameState.playerX === playerId
        ? EGAME_PLAYER.X
        : gameState.playerO === playerId
          ? EGAME_PLAYER.O
          : null;

    if (!playerSymbol) {
      throw new BadRequestException('You are not a player in this game');
    }

    // Validate move coordinates
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      throw new BadRequestException('Invalid move coordinates');
    }

    // Check if cell is empty
    if (gameState.board[row][col] !== '') {
      throw new BadRequestException('This cell is already occupied');
    }

    // Make the move
    gameState.board[row][col] = playerSymbol;

    // Check for winner after player's move
    let winner = this.checkWinner(gameState.board);
    if (winner) {
      gameState.status = EGAME_STATUS.COMPLETED;
      gameState.winner = winner;
      await this.persistGameResult(gameState);
      
      // Update Redis
      await this.redisService.set(
        `${GAME_REDIS_PREFIX}:${gameId}`,
        gameState,
        GAME_TTL,
      );
      
      return gameState;
    }

    // Check for draw after player's move
    if (this.isBoardFull(gameState.board)) {
      gameState.status = EGAME_STATUS.COMPLETED;
      gameState.winner = EGAME_STATUS.DRAW;
      await this.persistGameResult(gameState);
      
      // Update Redis
      await this.redisService.set(
        `${GAME_REDIS_PREFIX}:${gameId}`,
        gameState,
        GAME_TTL,
      );
      
      return gameState;
    }

    // Bot makes a move if the player is not the bot itself
    if (playerId !== EGAME_PLAYER.O) {
      // Get intelligent bot move
      const botMove = this.makeBotMove(gameState.board);
      
      if (botMove) {
        gameState.board[botMove.row][botMove.col] = EGAME_PLAYER.O;

        // Check for winner after bot's move
        winner = this.checkWinner(gameState.board);
        if (winner) {
          gameState.status = EGAME_STATUS.COMPLETED;
          gameState.winner = winner;
          await this.persistGameResult(gameState);
        } 
        // Check for draw after bot's move
        else if (this.isBoardFull(gameState.board)) {
          gameState.status = EGAME_STATUS.COMPLETED;
          gameState.winner = EGAME_STATUS.DRAW;
          await this.persistGameResult(gameState);
        }
      }
    }

    // Switch turn if game is still in progress
    if (gameState.status === EGAME_STATUS.IN_PROGRESS) {
      gameState.currentPlayer =
        gameState.currentPlayer === EGAME_PLAYER.X
          ? EGAME_PLAYER.O
          : EGAME_PLAYER.X;
    }

    // Update Redis
    await this.redisService.set(
      `${GAME_REDIS_PREFIX}:${gameId}`,
      gameState,
      GAME_TTL,
    );

    return gameState;
  }

  /**
   * Implements an intelligent bot move with strategy:
   * 1. Win if possible
   * 2. Block opponent from winning
   * 3. Take center
   * 4. Take corner
   * 5. Take any available cell
   */
  private makeBotMove(board: BoardState): { row: number; col: number } | null {
    // 1. Check if bot can win
    const winningMove = this.findWinningMove(board, EGAME_PLAYER.O);
    if (winningMove) {
      return winningMove;
    }

    // 2. Check if player can win and block
    const blockingMove = this.findWinningMove(board, EGAME_PLAYER.X);
    if (blockingMove) {
      return blockingMove;
    }

    // 3. Take center if available
    if (board[1][1] === '') {
      return { row: 1, col: 1 };
    }

    // 4. Take corner if available
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ];
    
    for (const corner of corners) {
      if (board[corner.row][corner.col] === '') {
        return corner;
      }
    }

    // 5. Take any available cell
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === '') {
          return { row, col };
        }
      }
    }

    return null; // No move available (shouldn't happen unless board is full)
  }

  /**
   * Find a winning move for the specified player
   */
  private findWinningMove(board: BoardState, player: EGAME_PLAYER): { row: number; col: number } | null {
    // Check each empty cell
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === '') {
          // Try the move
          board[row][col] = player;
          
          // Check if this move wins
          const isWinningMove = this.checkWinner(board) === player;
          
          // Undo the move
          board[row][col] = '';
          
          if (isWinningMove) {
            return { row, col };
          }
        }
      }
    }
    
    return null; // No winning move found
  }

  /**
   * Get game state by ID
   */
  async getGameState(gameId: string): Promise<GameStateDto> {
    // Try to get from Redis first
    const gameState = await this.redisService.get<GameStateDto>(
      `${GAME_REDIS_PREFIX}:${gameId}`,
    );

    if (gameState) {
      return gameState;
    }

    // If not in Redis, try to get from PostgreSQL (completed games)
    const gameEntity = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!gameEntity) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    return plainToInstance(GameStateDto, gameEntity);
  }

  /**
   * Check if there's a winner
   */
  private checkWinner(board: BoardState): 'X' | 'O' | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] &&
        board[i][0] === board[i][1] &&
        board[i][0] === board[i][2]
      ) {
        return board[i][0] as 'X' | 'O';
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (
        board[0][i] &&
        board[0][i] === board[1][i] &&
        board[0][i] === board[2][i]
      ) {
        return board[0][i] as 'X' | 'O';
      }
    }

    // Check diagonals
    if (
      board[0][0] &&
      board[0][0] === board[1][1] &&
      board[0][0] === board[2][2]
    ) {
      return board[0][0] as 'X' | 'O';
    }

    if (
      board[0][2] &&
      board[0][2] === board[1][1] &&
      board[0][2] === board[2][0]
    ) {
      return board[0][2] as 'X' | 'O';
    }

    return null;
  }

  /**
   * Check if the board is full (draw condition)
   */
  private isBoardFull(board: BoardState): boolean {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === '') {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Persist completed game to PostgreSQL
   */
  private async persistGameResult(gameState: GameStateDto) {
    await this.gameRepository.save(
      this.gameRepository.create({
        ...gameState,
        status: EGAME_STATUS.COMPLETED,
      }),
    );
    return 'SUCCESS';
  }

  /**
   * List completed games
   */
  async getCompletedGames(limit = 10): Promise<GameStateDto[]> {
    const games = await this.gameRepository.find({
      where: { status: 'COMPLETED' },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return games.map((game) => ({
      id: game.id,
      board: game.board,
      playerX: game.playerX,
      playerO: game.playerO,
      currentPlayer: 'X', // Not relevant for completed games
      status: 'COMPLETED',
      winner: game.winner,
    }));
  }

  /**
   * Get stats for a player
   */
  async getPlayerStats(playerId: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
  }> {
    // Find games where the player participated
    const gamesAsX = await this.gameRepository.find({
      where: { playerX: playerId, status: 'COMPLETED' },
    });

    const gamesAsO = await this.gameRepository.find({
      where: { playerO: playerId, status: 'COMPLETED' },
    });

    const allGames = [...gamesAsX, ...gamesAsO];

    // Calculate stats
    const wins = allGames.filter(
      (game) =>
        (game.playerX === playerId && game.winner === 'X') ||
        (game.playerO === playerId && game.winner === 'O'),
    ).length;

    const losses = allGames.filter(
      (game) =>
        (game.playerX === playerId && game.winner === 'O') ||
        (game.playerO === playerId && game.winner === 'X'),
    ).length;

    const draws = allGames.filter((game) => game.winner === 'DRAW').length;

    return {
      totalGames: allGames.length,
      wins,
      losses,
      draws,
    };
  }
}
