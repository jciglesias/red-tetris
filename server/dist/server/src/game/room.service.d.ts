import { GameState } from '@red-tetris/shared';
import type { Room, Player, PieceType } from '@red-tetris/shared';
import { PieceService } from './piece.service';
export declare class RoomService {
    private pieceService;
    private rooms;
    constructor(pieceService: PieceService);
    createRoom(name: string, hostPlayer: Player): Room;
    getRoom(name: string): Room | undefined;
    getAllRooms(): Room[];
    addPlayerToRoom(roomName: string, player: Player): Room | null;
    removePlayerFromRoom(roomName: string, playerId: string): Room | null;
    updatePlayerInRoom(roomName: string, updatedPlayer: Player): Room | null;
    startGame(roomName: string): Room | null;
    endGame(roomName: string): Room | null;
    resetGame(roomName: string): Room | null;
    getNextPiece(roomName: string): PieceType | null;
    updateRoomState(roomName: string, state: GameState): Room | null;
    getRoomByPlayerId(playerId: string): {
        room: Room;
        roomName: string;
    } | null;
}
