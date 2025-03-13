import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TictactoeService } from './tictactoe.service';
import { CreateGameDto, JoinGameDto, MoveDto } from './dtos/game.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // For production, restrict this to specific origins
  },
  transports: ['websocket', 'polling'], 
})

export class TictactoeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // Track connected clients
  private clients: Map<string, string> = new Map(); // socketId -> playerId

  // Track active games with rooms
  private gameRooms: Map<string, Set<string>> = new Map(); // gameId -> Set of socketIds

  constructor(private readonly tictactoeService: TictactoeService) {}

  afterInit(server: Server) {
    
    Logger.log('[TicTacToeGateway]::Initialized with Postman test handlers');
  }

  handleConnection(client: Socket) {
    Logger.log(`[TicTacToeGateway ]::Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    Logger.log(`[TicTacToeGateway ]::Client disconnected: ${client.id}`);

    // Remove from clients map
    const playerId = this.clients.get(client.id);
    this.clients.delete(client.id);

    // Notify any active games this client was part of
    this.gameRooms.forEach((socketIds, gameId) => {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);

        // Notify other players in the room
        client.to(gameId).emit('player_disconnected', { playerId });
      }
    });
  }

  @SubscribeMessage('create_game')
  async handleCreateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() createGameDto: CreateGameDto,
  ) {
    try {
      Logger.log(
        `[TicTacToeGateway]::Creating game for player: ${createGameDto.playerName}`,
      );

      const id = client?.id || `postman-${Date.now()}`;
      Logger.log(`Using socket with ID: ${id}`);

      // Store player ID
      this.clients.set(id, createGameDto.playerName);

      // Create the game
      const gameState = await this.tictactoeService.createGame(createGameDto);

      // Join the room for this game without using client.join
      if (gameState && gameState.id) {
        // Use socket rooms through server instead
        client.join(gameState.id.toString());
        Logger.log(`Socket ${id} joined room ${gameState.id}`);
      } else {
        throw new Error('Game state or ID is invalid');
      }

      // Track this client in the game room
      if (!this.gameRooms.has(gameState.id)) {
        this.gameRooms.set(gameState.id, new Set());
      }
      this.gameRooms.get(gameState.id).add(id);

      return {
        event: 'game_created',
        data: gameState,
      };
    } catch (error) {
      Logger.error(`[TicTacToeGateway]::Error creating game: ${error.message}`);
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('join_game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinGameDto: JoinGameDto,
  ) {
    try {
      Logger.log(
        `[TicTacToeGateway]::Player ${joinGameDto.playerName} joining game: ${joinGameDto.gameId}`,
      );

      // Check if client is defined
      if (!client || !client.id) {
        throw new Error('Socket connection is not established properly');
      }
      Logger.log(`Using socket with ID: ${client.id}`);

      // Store player ID
      this.clients.set(client.id, joinGameDto.playerName);

      // Join the game
      const gameState = await this.tictactoeService.joinGame(joinGameDto);

      // Join the socket room
      client.join(gameState.id.toString());
      Logger.log(`Socket ${client.id} joined room ${gameState.id}`);

      // Track this client in the game room
      if (!this.gameRooms.has(gameState.id)) {
        this.gameRooms.set(gameState.id, new Set());
      }
      this.gameRooms.get(gameState.id).add(client.id);

      // Broadcast to all clients in the room
      this.server.to(gameState.id).emit('game_updated', gameState);

      return {
        event: 'joined_game',
        data: gameState,
      };
    } catch (error) {
      Logger.error(`[TicTacToeGateway]::Error joining game: ${error.message}`);
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('make_move')
  async handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() moveDto: MoveDto,
  ) {

  }

  @SubscribeMessage('get_game')
  async handleGetGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string },
  ) {
  }

  @SubscribeMessage('get_completed_games')
  async handleGetCompletedGames() {
  }

  @SubscribeMessage('get_player_stats')
  async handleGetPlayerStats(@MessageBody() data: { playerId: string }) {

  }

  // Also add non-decorator variants of the handler methods
  @SubscribeMessage('create_game_no_decorator')
  async handleCreateGameNoDecorator(@MessageBody() createGameDto: CreateGameDto) {
  }
}
