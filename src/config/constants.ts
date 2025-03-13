export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

//tic tac toe constants
export const GAME_TTL = 10800; // Game state TTL in Redis (3 hours)
export const GAME_REDIS_PREFIX = 'game:';
export enum EGAME_STATUS {
  WAITING_FOR_OPPONENT = 'WAITING_FOR_OPPONENT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DRAW = 'DRAW',
}
export enum EGAME_PLAYER {
  X = 'X',
  O = 'O',
}
