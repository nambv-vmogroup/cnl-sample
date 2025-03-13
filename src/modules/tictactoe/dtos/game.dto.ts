import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsNumber, 
  IsIn, 
  IsOptional, 
  Min, 
  Max 
} from 'class-validator';
import { BoardState } from '../entities/game.entity';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty({ message: 'Player name is required' })
  playerName: string;
}

export class JoinGameDto {
  @IsUUID(4, { message: 'Invalid game ID format' })
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player name is required' })
  playerName: string;
}

export class MoveDto {
  @IsUUID(4, { message: 'Invalid game ID format' })
  @IsOptional() // This can be set from the URL parameter
  gameId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsNumber()
  @Min(0, { message: 'Row must be between 0 and 2' })
  @Max(2, { message: 'Row must be between 0 and 2' })
  row: number;

  @IsNumber()
  @Min(0, { message: 'Column must be between 0 and 2' })
  @Max(2, { message: 'Column must be between 0 and 2' })
  col: number;
}

export class GameStateDto {
  @IsUUID(4)
  id: string;

  board: BoardState;

  @IsString()
  @IsNotEmpty()
  playerX: string;

  @IsString()
  @IsOptional()
  playerO?: string;

  @IsIn(['X', 'O'])
  currentPlayer: 'X' | 'O';

  @IsIn(['WAITING_FOR_OPPONENT', 'IN_PROGRESS', 'COMPLETED'])
  status: 'WAITING_FOR_OPPONENT' | 'IN_PROGRESS' | 'COMPLETED';

  @IsIn(['X', 'O', 'DRAW'])
  @IsOptional()
  winner?: 'X' | 'O' | 'DRAW';
}
