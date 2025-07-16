import { PieceType, GameState, PlayerState, MoveDirection, RotationDirection } from './constants';

// Basic position interface
export interface Position {
  x: number;
  y: number;
}

// Piece shape definition
export interface PieceShape {
  type: PieceType;
  blocks: Position[];
  center: Position;
}

// Active piece in the game
export interface Piece {
  type: PieceType;
  position: Position;
  rotation: number;
  shape: Position[];
}

// Game board representation
export type Board = (PieceType | null)[][];

// Player spectrum (height of each column)
export type Spectrum = number[];

// Player information
export interface Player {
  id: string;
  name: string;
  state: PlayerState;
  board: Board;
  spectrum: Spectrum;
  currentPiece: Piece | null;
  nextPiece: PieceType | null;
  isHost: boolean;
  linesCleared: number;
}

// Room/Game information
export interface Room {
  id: string;
  name: string;
  state: GameState;
  players: Player[];
  hostId: string;
  maxPlayers: number;
  pieceSequence: PieceType[];
  currentPieceIndex: number;
}

// Socket event payloads
export interface JoinRoomPayload {
  roomName: string;
  playerName: string;
}

export interface RoomJoinedPayload {
  room: Room;
  playerId: string;
}

export interface MovePayload {
  direction: MoveDirection;
}

export interface RotatePayload {
  direction: RotationDirection;
}

export interface PiecePlacedPayload {
  playerId: string;
  board: Board;
  linesCleared: number;
}

export interface LinesClearedPayload {
  playerId: string;
  linesCleared: number;
}

export interface PenaltyLinesPayload {
  targetPlayerId: string;
  lineCount: number;
}

export interface BoardUpdatePayload {
  playerId: string;
  board: Board;
  currentPiece: Piece | null;
}

export interface SpectrumUpdatePayload {
  playerId: string;
  spectrum: Spectrum;
}

export interface NextPiecePayload {
  playerId: string;
  nextPiece: PieceType;
}

export interface PlayerUpdatePayload {
  player: Player;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// Game configuration
export interface GameConfig {
  dropInterval: number; // milliseconds
  penaltyLinesPerClear: number;
  maxPlayers: number;
}
