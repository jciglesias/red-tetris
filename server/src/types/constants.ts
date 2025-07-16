// Game constants
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const VISIBLE_HEIGHT = 20;

// Piece types
export enum PieceType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L'
}

// Game states
export enum GameState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

// Player states
export enum PlayerState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

// Socket events
export enum SocketEvents {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Room management
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_UPDATE = 'room_update',
  
  // Game management
  START_GAME = 'start_game',
  GAME_STARTED = 'game_started',
  GAME_OVER = 'game_over',
  RESTART_GAME = 'restart_game',
  
  // Gameplay
  MOVE_PIECE = 'move_piece',
  ROTATE_PIECE = 'rotate_piece',
  DROP_PIECE = 'drop_piece',
  HARD_DROP = 'hard_drop',
  PIECE_PLACED = 'piece_placed',
  LINES_CLEARED = 'lines_cleared',
  PENALTY_LINES = 'penalty_lines',
  
  // State updates
  BOARD_UPDATE = 'board_update',
  SPECTRUM_UPDATE = 'spectrum_update',
  NEXT_PIECE = 'next_piece',
  PLAYER_UPDATE = 'player_update',
  
  // Errors
  ERROR = 'error'
}

// Movement directions
export enum MoveDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  DOWN = 'DOWN'
}

// Rotation direction
export enum RotationDirection {
  CLOCKWISE = 'CLOCKWISE',
  COUNTERCLOCKWISE = 'COUNTERCLOCKWISE'
}
