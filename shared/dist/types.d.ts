import { PieceType, GameState, PlayerState, MoveDirection, RotationDirection } from './constants';
export interface Position {
    x: number;
    y: number;
}
export interface PieceShape {
    type: PieceType;
    blocks: Position[];
    center: Position;
}
export interface Piece {
    type: PieceType;
    position: Position;
    rotation: number;
    shape: Position[];
}
export type Board = (PieceType | null)[][];
export type Spectrum = number[];
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
export interface GameConfig {
    dropInterval: number;
    penaltyLinesPerClear: number;
    maxPlayers: number;
}
//# sourceMappingURL=types.d.ts.map