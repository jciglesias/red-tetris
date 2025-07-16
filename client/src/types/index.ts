export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  level: number;
  lines: number;
  isAlive: boolean;
  board: Board;
  spectrum: number[];
}

export interface Room {
  name: string;
  players: Player[];
  gameState: GameState;
  host: string;
  maxPlayers: number;
  createdAt: Date;
}

export type Board = number[][];

export enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished',
}