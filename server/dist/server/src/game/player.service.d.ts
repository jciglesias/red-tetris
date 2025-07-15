import { PlayerState } from '../../../shared/src';
import type { Player, Board, Piece, PieceType } from '../../../shared/src';
export declare class PlayerService {
    createPlayer(name: string, isHost?: boolean): Player;
    updatePlayerBoard(player: Player, board: Board): Player;
    setCurrentPiece(player: Player, piece: Piece | null): Player;
    setNextPiece(player: Player, pieceType: PieceType | null): Player;
    updatePlayerState(player: Player, state: PlayerState): Player;
    incrementLinesCleared(player: Player, lines: number): Player;
    placePieceOnBoard(player: Player, piece: Piece): {
        board: Board;
        linesCleared: number;
    };
    addPenaltyLines(player: Player, lineCount: number): Player;
    checkGameOver(player: Player): boolean;
    resetPlayer(player: Player): Player;
}
