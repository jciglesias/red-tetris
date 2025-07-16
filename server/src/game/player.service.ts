import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PlayerState, createEmptyBoard, calculateSpectrum, BOARD_WIDTH, BOARD_HEIGHT } from '@red-tetris/shared';
import type { Player, Board, Spectrum, Piece, PieceType } from '@red-tetris/shared';

@Injectable()
export class PlayerService {
  createPlayer(name: string, isHost = false): Player {
    return {
      id: uuidv4(),
      name,
      state: PlayerState.WAITING,
      board: createEmptyBoard(),
      spectrum: Array(BOARD_WIDTH).fill(0),
      currentPiece: null,
      nextPiece: null,
      isHost,
      linesCleared: 0,
    };
  }

  updatePlayerBoard(player: Player, board: Board): Player {
    return {
      ...player,
      board,
      spectrum: calculateSpectrum(board),
    };
  }

  setCurrentPiece(player: Player, piece: Piece | null): Player {
    return {
      ...player,
      currentPiece: piece,
    };
  }

  setNextPiece(player: Player, pieceType: PieceType | null): Player {
    return {
      ...player,
      nextPiece: pieceType,
    };
  }

  updatePlayerState(player: Player, state: PlayerState): Player {
    return {
      ...player,
      state,
    };
  }

  incrementLinesCleared(player: Player, lines: number): Player {
    return {
      ...player,
      linesCleared: player.linesCleared + lines,
    };
  }

  placePieceOnBoard(player: Player, piece: Piece): { board: Board; linesCleared: number } {
    const newBoard = player.board.map(row => [...row]);
    
    // Place piece on board
    piece.shape.forEach(block => {
      const x = block.x + piece.position.x;
      const y = block.y + piece.position.y;
      
      if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
        newBoard[y][x] = piece.type;
      }
    });

    // Check for completed lines
    const completedLines: number[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (newBoard[y].every(cell => cell !== null)) {
        completedLines.push(y);
      }
    }

    // Remove completed lines
    completedLines.reverse().forEach(lineIndex => {
      newBoard.splice(lineIndex, 1);
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    });

    return {
      board: newBoard,
      linesCleared: completedLines.length,
    };
  }

  addPenaltyLines(player: Player, lineCount: number): Player {
    const newBoard = player.board.map(row => [...row]);
    
    // Remove top lines
    newBoard.splice(0, lineCount);
    
    // Add penalty lines at bottom
    for (let i = 0; i < lineCount; i++) {
      const penaltyLine = Array(BOARD_WIDTH).fill('penalty' as any);
      // Add one gap randomly
      const gapIndex = Math.floor(Math.random() * BOARD_WIDTH);
      penaltyLine[gapIndex] = null;
      newBoard.push(penaltyLine);
    }

    return {
      ...player,
      board: newBoard,
      spectrum: calculateSpectrum(newBoard),
    };
  }

  checkGameOver(player: Player): boolean {
    // Check if any piece in the top two rows would mean game over
    return player.board[0].some(cell => cell !== null) || 
           player.board[1].some(cell => cell !== null);
  }

  resetPlayer(player: Player): Player {
    return {
      ...player,
      state: PlayerState.WAITING,
      board: createEmptyBoard(),
      spectrum: Array(BOARD_WIDTH).fill(0),
      currentPiece: null,
      nextPiece: null,
      linesCleared: 0,
    };
  }
}
