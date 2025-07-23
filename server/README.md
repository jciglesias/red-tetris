<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Red Tetris is a real-time multiplayer Tetris game built with NestJS and Socket.IO. Players can join rooms, play competitive Tetris matches, and send penalty lines to opponents when clearing multiple lines.

## Features

- **Real-time multiplayer gameplay** with Socket.IO
- **Room-based system** for multiple concurrent games
- **Automatic host transfer** - seamless host management when hosts disconnect
- **In-room chat** - simple, non-persistent messaging within each room
- **Live scoring system** - see player scores, levels, and lines cleared in real-time
- **Comprehensive leaderboard** with player statistics, win rates, and all-time records
- **Penalty system** - clearing multiple lines sends penalty blocks to opponents
- **Skip piece action** - each player can skip one piece per game strategically
- **Fast mode support** - games with 2x speed for experienced players
- **Reconnection support** with game state restoration
- **Spectrum view** showing opponent's board height profile
- **Full game state synchronization** across all clients
- **Solo and multiplayer game support** with different win conditions

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Client 1      │    │   Client 2      │    │   Client N      │
│   (React App)   │    │   (React App)   │    │   (React App)   │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │         WebSocket (Socket.IO)               │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │                 │
                    │   NestJS        │
                    │   Server        │
                    │                 │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │                 │
                    │   Game Engine   │
                    │   - Room Mgmt   │
                    │   - Game Logic  │
                    │   - State Sync  │
                    │                 │
                    └─────────────────┘
```

### Module Structure

The server is organized into modular components:

- **App Module**: Main application module and configuration
- **Room Module**: Room management and player coordination
- **Game Module**: Core game logic and state management
- **Gateway**: WebSocket event handling and communication

### Key Services

#### RoomService
Manages game rooms and player sessions:
- Room creation and cleanup
- Player join/leave logic
- Ready state management
- Reconnection handling
- **Automatic host transfer** when the host disconnects

#### GameService
Handles core Tetris game logic:
- Piece generation and movement
- Line clearing and scoring
- Penalty system
- Game state validation

#### GameLoopService
Manages real-time game execution:
- 60 FPS game loop
- Automatic piece dropping
- State synchronization
- Performance monitoring

## Advanced Features

### Reconnection System

The server implements a sophisticated reconnection system:

1. **Token Generation**: Each player receives a unique reconnection token
2. **State Preservation**: Game state is preserved for disconnected players
3. **Graceful Reconnection**: Players can rejoin mid-game with full state restoration
4. **Timeout Handling**: Automatic cleanup after extended disconnections

### Host Transfer System

The server automatically handles host transfers when the current host disconnects:

1. **Smart Host Selection**: When a host disconnects, the system intelligently selects a new host:
   - **Priority 1**: Connected players who are ready
   - **Priority 2**: Any connected player (if no ready players available)
2. **Seamless Transfer**: Host privileges are automatically transferred without game interruption
3. **Real-time Notifications**: All players receive immediate notifications about host changes
4. **State Consistency**: Host status is properly updated across all game components
5. **Fallback Handling**: Gracefully handles edge cases like empty rooms or all players disconnected

**Events Emitted:**
- `host-changed`: Detailed information about the host transfer
- `player-disconnected`: Enhanced with host change information for backward compatibility

### Spectator Mode

Players can spectate ongoing games:
- View all players' boards in real-time
- See penalty exchanges and line clears
- No interference with game state
- Automatic UI updates

### Load Balancing

For production deployments:
- Horizontal scaling with Redis adapter
- Room-based load distribution
- Session affinity for reconnections
- Health checks and monitoring

## API Reference

### WebSocket Events

#### Client → Server Events

| Event | Parameters | Description | Example |
|-------|------------|-------------|---------|
| `join-room` | `{ roomName: string, playerName: string, reconnectionToken?: string }` | Join or create a room | `{ roomName: "room1", playerName: "player1" }` |
| `player-ready` | `{ ready: boolean }` | Toggle ready state | `{ ready: true }` |
| `start-game` | `{ fast?: boolean }` | Start the game (normal or fast mode) | `{ fast: true }` |
| `game-action` | `{ action: string }` | Send game action | `{ action: "move-left" }` |
| `restart-game` | `{}` | Restart current game | `{}` |
| `get-room-info` | `{}` | Get room information | `{}` |
| `heartbeat` | `{}` | Send heartbeat | `{}` |
| `chat-message` | `{ message: string }` | Send chat message to room | `{ message: "Hello everyone!" }` |
| `quit-game` | `{}` | Quit current game (saves progress for solo games) | `{}` |
| `request-reconnection` | `{ roomName: string, playerName: string, reconnectionToken?: string }` | Request reconnection | `{ roomName: "room1", playerName: "player1", reconnectionToken: "abc123" }` |

#### Server → Client Events

| Event | Data | Description | Example |
|-------|------|-------------|---------|
| `join-room-success` | `{ player: object, room: object, gameState?: object, isReconnection: boolean }` | Successfully joined room | See example below |
| `join-room-error` | `{ message: string }` | Failed to join room | `{ message: "Room name and player name are required" }` |
| `player-joined` | `{ player: object, players: object[] }` | Player joined room | See example below |
| `player-disconnected` | `{ playerId: string, playerName: string, players: object[], canReconnect: boolean, hostChanged?: boolean, newHost?: { id: string, name: string } }` | Player disconnected with optional host transfer info | `{ playerId: "room1_player1", playerName: "Player 1", players: [...], canReconnect: true, hostChanged: true, newHost: { id: "room1_player2", name: "Player 2" } }` |
| `host-changed` | `{ newHostId: string, newHostName: string, previousHostId: string, previousHostName: string, players: object[] }` | Host transferred to another player | `{ newHostId: "room1_player2", newHostName: "Player 2", previousHostId: "room1_player1", previousHostName: "Player 1", players: [...] }` |
| `player-ready-changed` | `{ playerId: string, ready: boolean, players: object[], canStart: boolean }` | Player ready state changed | `{ playerId: "room1_player1", ready: true, players: [...], canStart: true }` |
| `game-started` | `{ gameState: object, players: object[] }` | Game started | See GameState structure |
| `game-state-update` | `{ gameState: object, players: object[] }` | Game state updated with live player scores | See GameState structure |
| `game-ended` | `{ winner: string, finalState: object }` | Game ended | `{ winner: "room1_player1", finalState: {...} }` |
| `game-paused` | `{ reason: string }` | Game paused | `{ reason: "All players disconnected" }` |
| `game-reset` | `{ players: object[] }` | Game reset | `{ players: [...] }` |
| `player-quit` | `{ playerId: string, playerName: string }` | Player quit mid-game | `{ playerId: "room1_player1", playerName: "Player1" }` |
| `player-reconnected` | `{ player: object, players: object[] }` | Player reconnected | See example below |
| `room-info` | `{ room: object, gameState?: object }` | Room information response | See example below |
| `reconnection-success` | `{ player: object, room: object, gameState?: object }` | Reconnection successful | See example below |
| `reconnection-error` | `{ message: string }` | Reconnection failed | `{ message: "Invalid reconnection token" }` |
| `heartbeat-ack` | `{}` | Heartbeat acknowledged | `{}` |
| `chat-message` | `{ playerId: string, playerName: string, message: string, timestamp: string }` | Chat message from player | See example below |
| `error` | `{ message: string }` | Error occurred | `{ message: "Player not found in any room" }` |

### Game Actions (WebSocket)

The `game-action` event accepts the following action types:

| Action | Description | When Available | Example |
|--------|-------------|---------------|---------|
| `move-left` | Move current piece left | During active game | `{ action: "move-left" }` |
| `move-right` | Move current piece right | During active game | `{ action: "move-right" }` |
| `rotate` | Rotate current piece clockwise | During active game | `{ action: "rotate" }` |
| `soft-drop` | Accelerate piece downward | During active game | `{ action: "soft-drop" }` |
| `hard-drop` | Instantly drop piece to bottom | During active game | `{ action: "hard-drop" }` |
| `skip-piece` | Skip current piece (one use per game) | During active game | `{ action: "skip-piece" }` |

**Usage:**
```javascript
// Send a game action via WebSocket
socket.emit('game-action', { action: 'move-left' });
socket.emit('game-action', { action: 'rotate' });
socket.emit('game-action', { action: 'hard-drop' });
socket.emit('game-action', { action: 'skip-piece' }); // Can only be used once per game
```

### REST API Endpoints

#### Leaderboard API

| Method | Endpoint | Parameters | Description | Response |
|--------|----------|------------|-------------|----------|
| `GET` | `/api/leaderboard/top` | `?limit=10` (optional) | Get top scores | `LeaderboardEntry[]` |
| `GET` | `/api/leaderboard/player` | `?name=playerName` (required) | Get player's best score | `LeaderboardEntry \| null` |
| `GET` | `/api/leaderboard/player-stats` | `?name=playerName` (required) | Get player's detailed statistics | `PlayerStatistics` |
| `GET` | `/api/leaderboard/top-winners` | `?limit=10` (optional) | Get top winners by win rate | `TopWinnerEntry[]` |
| `GET` | `/api/leaderboard/stats` | None | Get all-time statistics | `LeaderboardStats` |

#### Health Check

| Method | Endpoint | Parameters | Description | Response |
|--------|----------|------------|-------------|----------|
| `GET` | `/health` | None | Server and database status | `HealthStatus` |

### Data Structures

#### Player Object
```typescript
interface Player {
  id: string;           // Format: "roomName_playerName"
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: Date;
  reconnectionToken: string;
  score: number;        // Live player score (updated during gameplay)
  level: number;        // Current game level
  linesCleared: number; // Lines cleared so far
}
```

#### GameState Object
```typescript
interface GameState {
  roomName: string;
  players: {
    [playerId: string]: {
      playerId: string;
      board: number[][];
      currentPiece: Piece | null;
      nextPieces: Piece[];
      spectrum: number[];
      lines: number;
      score: number;        // Player's current score
      level: number;        // Current level (affects drop speed)
      isAlive: boolean;
      penalties: number;
    };
  };
  gameOver: boolean;
  winner: string | null;
  startTime: number;
  fastMode: boolean; // true for fast mode (pieces fall 2x faster), false for normal mode
}
```

#### Piece Object
```typescript
interface Piece {
  type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  x: number;
  y: number;
  rotation: number;
  shape: number[][];
}
```

#### GameActionMessage Object (WebSocket)
```typescript
interface GameActionMessage {
  action: 'move-left' | 'move-right' | 'rotate' | 'soft-drop' | 'hard-drop' | 'skip-piece';
}
```

#### JoinRoomMessage Object (WebSocket)
```typescript
interface JoinRoomMessage {
  roomName: string;
  playerName: string;
  reconnectionToken?: string;
}
```

#### PlayerReadyMessage Object (WebSocket)
```typescript
interface PlayerReadyMessage {
  ready: boolean;
}
```

#### ChatMessage Object (WebSocket)
```typescript
interface ChatMessage {
  message: string; // Max 500 characters, will be trimmed
}
```

#### LeaderboardEntry Object
```typescript
interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  linesCleared: number;
  level: number;
  gameDuration: number; // in milliseconds
  fastMode: boolean;    // true for fast mode games
  isWin: boolean;       // whether this was a winning game
  roomName?: string;
  createdAt: Date;
}
```

#### PlayerStatistics Object
```typescript
interface PlayerStatistics {
  totalGames: number;
  gamesWon: number;
  bestScore: number;
  totalLinesCleared: number;
  averageGameDuration: number; // in milliseconds
  winRate: number; // percentage (0-100)
}
```

#### TopWinnerEntry Object
```typescript
interface TopWinnerEntry {
  playerName: string;
  gamesWon: number;
  winRate: number;    // percentage (0-100)
  bestScore: number;
}
```

#### LeaderboardStats Object
```typescript
interface LeaderboardStats {
  topScore: number;
  topScorePlayer: string;
  mostLinesCleared: number;
  mostLinesClearedPlayer: string;
  longestGameDuration: number;
  longestGamePlayer: string;
  totalGames: number;
}
```

#### CreateLeaderboardEntryDto Object
```typescript
interface CreateLeaderboardEntryDto {
  playerName: string;
  score: number;
  linesCleared: number;
  level: number;
  gameDuration: number; // in milliseconds
  fastMode?: boolean;   // optional - game mode
  isWin?: boolean;      // optional - whether this was a winning game
  roomName?: string;    // optional
}
```

#### HealthStatus Object
```typescript
interface HealthStatus {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
  timestamp: string;
  totalGames?: number;
  error?: string;
}
```

### REST API Examples

#### Get Top Scores
```bash
curl "http://localhost:3001/api/leaderboard/top?limit=5"
```
```json
[
  {
    "id": 1,
    "playerName": "Player1",
    "score": 15000,
    "linesCleared": 150,
    "level": 8,
    "gameDuration": 600000,
    "roomName": "room1",
    "createdAt": "2025-07-21T10:30:00.000Z"
  }
]
```

#### Get Player Best Score
```bash
curl "http://localhost:3001/api/leaderboard/player?name=Player1"
```
```json
{
  "id": 1,
  "playerName": "Player1",
  "score": 15000,
  "linesCleared": 150,
  "level": 8,
  "gameDuration": 600000,
  "fastMode": false,
  "isWin": true,
  "roomName": "room1",
  "createdAt": "2025-07-21T10:30:00.000Z"
}
```

#### Get Player Statistics
```bash
curl "http://localhost:3001/api/leaderboard/player-stats?name=Player1"
```
```json
{
  "totalGames": 15,
  "gamesWon": 8,
  "bestScore": 15000,
  "totalLinesCleared": 1200,
  "averageGameDuration": 450000,
  "winRate": 53.33
}
```

#### Get Top Winners
```bash
curl "http://localhost:3001/api/leaderboard/top-winners?limit=5"
```
```json
[
  {
    "playerName": "ChampionPlayer",
    "gamesWon": 25,
    "winRate": 83.33,
    "bestScore": 22000
  },
  {
    "playerName": "ProGamer",
    "gamesWon": 18,
    "winRate": 75.0,
    "bestScore": 18500
  }
]
```

#### Get All-Time Statistics
```bash
curl "http://localhost:3001/api/leaderboard/stats"
```
```json
{
  "topScore": 15000,
  "topScorePlayer": "Player1",
  "mostLinesCleared": 150,
  "mostLinesClearedPlayer": "Player1",
  "longestGameDuration": 600000,
  "longestGamePlayer": "Player1",
  "totalGames": 25
}
```

#### Submit New Score
```bash
curl -X POST "http://localhost:3001/api/leaderboard" \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "Player2",
    "score": 12000,
    "linesCleared": 120,
    "level": 6,
    "gameDuration": 480000,
    "roomName": "room2"
  }'
```
```json
{
  "id": 2,
  "playerName": "Player2",
  "score": 12000,
  "linesCleared": 120,
  "level": 6,
  "gameDuration": 480000,
  "roomName": "room2",
  "createdAt": "2025-07-21T11:00:00.000Z"
}
```

#### Health Check
```bash
curl "http://localhost:3001/health"
```
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-07-21T11:30:00.000Z",
  "totalGames": 25
}
```

### Error Messages

| Message | Description | Action |
|---------|-------------|---------|
| `"Room name and player name are required"` | Missing required parameters | Provide both room name and player name |
| `"Could not join room. Room may be full, game in progress, or name taken."` | Cannot join room | Try different room or wait for game to end |
| `"Player not found in any room"` | Player not connected to any room | Join a room first |
| `"Only host can start the game"` | Non-host tried to start game | Wait for host to start |
| `"Waiting for all players to be ready (X/Y ready)"` | Not all players are ready | Wait for all players to mark themselves ready |
| `"Cannot start game. Unknown reason."` | Game start failed for unknown reason | Contact support |
| `"Game is not currently in progress"` | Game action sent when game not playing | Wait for game to start |
| `"Only host can restart the game"` | Non-host tried to restart game | Wait for host to restart |
| `"Room not found"` | Reconnection to non-existent room | Check room name |
| `"Invalid reconnection token"` | Wrong reconnection token | Use correct token |
| `"No disconnected player found with that name"` | No player to reconnect | Check player name |
| `"Failed to reconnect player"` | Reconnection failed | Try joining room again |

### Response Examples

#### join-room-success
```json
{
  "player": {
    "id": "room1_player1",
    "name": "Player 1",
    "socketId": "abc123",
    "isHost": true,
    "isReady": false,
    "isConnected": true,
    "lastSeen": "2025-07-18T12:00:00.000Z",
    "reconnectionToken": "abc123def456"
  },
  "room": {
    "name": "room1",
    "players": [
      {
        "id": "room1_player1",
        "name": "Player 1",
        "isHost": true,
        "isReady": false,
        "isConnected": true
      }
    ],
    "gameState": "waiting"
  },
  "gameState": null,
  "isReconnection": false
}
```

#### player-joined
```json
{
  "player": {
    "id": "room1_player2",
    "name": "Player 2",
    "socketId": "def456",
    "isHost": false,
    "isReady": false,
    "isConnected": true
  },
  "players": [
    {
      "id": "room1_player1",
      "name": "Player 1",
      "isHost": true,
      "isReady": true,
      "isConnected": true
    },
    {
      "id": "room1_player2",
      "name": "Player 2",
      "isHost": false,
      "isReady": false,
      "isConnected": true
    }
  ]
}
```

#### room-info
```json
{
  "room": {
    "name": "room1",
    "gameState": "playing",
    "players": [
      {
        "id": "room1_player1",
        "name": "Player 1",
        "isHost": true,
        "isReady": true,
        "isConnected": true,
        "score": 1250,
        "level": 2,
        "linesCleared": 8
      }
    ]
  },
  "gameState": {
    "roomName": "room1",
    "players": {
      "room1_player1": {
        "playerId": "room1_player1",
        "board": [[0,0,0,0,0,0,0,0,0,0], ...],
        "currentPiece": {
          "type": "I",
          "x": 4,
          "y": 0,
          "rotation": 0,
          "shape": [[1,1,1,1]]
        },
        "nextPieces": [...],
        "spectrum": [0,0,0,0,0,0,0,0,0,0],
        "lines": 5,
        "score": 1250,
        "level": 2,
        "isAlive": true,
        "penalties": 0
      }
    },
    "gameOver": false,
    "winner": null,
    "startTime": 1234567890
  }
}
```

#### game-state-update
```json
{
  "gameState": {
    "roomName": "room1",
    "players": {
      "room1_player1": {
        "playerId": "room1_player1",
        "board": [[0,0,0,0,0,0,0,0,0,0], ...],
        "currentPiece": {
          "type": "I",
          "x": 4,
          "y": 0,
          "rotation": 0,
          "shape": [[1,1,1,1]]
        },
        "nextPieces": [...],
        "spectrum": [0,0,0,0,0,0,0,0,0,0],
        "lines": 5,
        "score": 1250,
        "level": 2,
        "isAlive": true,
        "penalties": 0
      }
    },
    "gameOver": false,
    "winner": null,
    "startTime": 1234567890,
    "fastMode": false
  },
  "players": [
    {
      "id": "room1_player1",
      "name": "Player1",
      "score": 1250,
      "level": 2,
      "linesCleared": 5,
      "isHost": true,
      "isReady": true,
      "isConnected": true
    }
  ]
}
```

#### leaderboard-data
```json
{
  "scores": [
    {
      "id": 1,
      "playerName": "ProPlayer",
      "score": 15000,
      "linesCleared": 75,
      "level": 8,
      "gameDuration": 450000,
      "roomName": "competitive",
      "createdAt": "2025-07-21T10:30:00.000Z"
    },
    {
      "id": 2,
      "playerName": "TetrisLord",
      "score": 12500,
      "linesCleared": 62,
      "level": 6,
      "gameDuration": 380000,
      "roomName": "room1",
      "createdAt": "2025-07-21T09:15:00.000Z"
    }
  ]
}
```

#### player-stats-data
```json
{
  "playerStats": {
    "id": 5,
    "playerName": "player1",
    "score": 8750,
    "linesCleared": 43,
    "level": 4,
    "gameDuration": 280000,
    "roomName": "practice",
    "createdAt": "2025-07-21T08:45:00.000Z"
  }
}
```

#### leaderboard-stats-data
```json
{
  "stats": {
    "topScore": 15000,
    "topScorePlayer": "ProPlayer",
    "mostLinesCleared": 75,
    "mostLinesClearedPlayer": "ProPlayer",
    "longestGameDuration": 450000,
    "longestGamePlayer": "ProPlayer",
    "totalGames": 125
  }
}
```

#### score-submitted
```json
{
  "success": true,
  "entry": {
    "id": 15,
    "playerName": "newPlayer",
    "score": 5500,
    "linesCleared": 28,
    "level": 3,
    "gameDuration": 200000,
    "roomName": "beginners",
    "createdAt": "2025-07-21T12:00:00.000Z"
  }
}
```

#### chat-message
```json
{
  "playerId": "room1_player1",
  "playerName": "Player1",
  "message": "Good luck everyone!",
  "timestamp": "2025-07-22T14:30:00.000Z"
}
```

### WebSocket API Documentation

The Red Tetris server uses Socket.IO for real-time communication. Below is the complete WebSocket API reference:

### Connection

Connect to the WebSocket server:
```javascript
const socket = io('http://localhost:3001');
```

### Client Events (Emit to Server)

#### `join-room`
Join or create a game room.
```javascript
socket.emit('join-room', {
  roomName: 'my-room',
  playerName: 'player1',
  reconnectionToken?: 'optional-token-for-reconnection'
});
```

#### `player-ready`
Toggle player ready state.
```javascript
socket.emit('player-ready', {
  ready: true // or false
});
```

#### `start-game`
Start the game (only works if all players are ready). Supports normal and fast modes.
```javascript
// Start normal game
socket.emit('start-game', { fast: false });

// Start fast game (pieces fall 2x faster)
socket.emit('start-game', { fast: true });

// Default behavior (normal mode)
socket.emit('start-game');
```

#### `game-action`
Send game actions (movement, rotation, dropping).
```javascript
socket.emit('game-action', {
  action: 'move-left' | 'move-right' | 'rotate' | 'soft-drop' | 'hard-drop' | 'skip-piece'
});
```

#### `restart-game`
Restart the current game.
```javascript
socket.emit('restart-game');
```

#### `get-room-info`
Get current room information.
```javascript
socket.emit('get-room-info');
```

#### `heartbeat`
Send heartbeat to maintain connection.
```javascript
socket.emit('heartbeat');
```

#### `chat-message`
Send a chat message to all players in the current room.
```javascript
socket.emit('chat-message', {
  message: 'Hello everyone!'
});
```

#### `request-reconnection`
Request reconnection with a token.
```javascript
socket.emit('request-reconnection', {
  roomName: 'room1',
  playerName: 'player1',
  reconnectionToken: 'your-token'
});
```

#### `quit-game`
Quit the current game (saves score for solo games).
```javascript
socket.emit('quit-game');
```

### Server Events (Listen from Server)

#### `join-room-success`
Fired when successfully joining a room.
```javascript
socket.on('join-room-success', (data) => {
  console.log('Joined room:', data.room);
  console.log('Player info:', data.player);
  console.log('Game state:', data.gameState); // If game in progress
  console.log('Is reconnection:', data.isReconnection);
});
```

#### `join-room-error`
Fired when room join fails.
```javascript
socket.on('join-room-error', (error) => {
  console.error('Failed to join room:', error);
});
```

#### `player-joined`
Fired when another player joins the room.
```javascript
socket.on('player-joined', (data) => {
  console.log('Player joined:', data.player);
  console.log('All players:', data.players);
});
```

#### `player-ready-changed`
Fired when a player's ready state changes.
```javascript
socket.on('player-ready-changed', (data) => {
  console.log('Player ready changed:', data.playerId, data.ready);
  console.log('All players:', data.players);
  console.log('Can start game:', data.canStart);
});
```

#### `game-started`
Fired when the game starts.
```javascript
socket.on('game-started', (data) => {
  console.log('Game started with state:', data.gameState);
  console.log('Players:', data.players);
  console.log('Fast mode:', data.gameState.fastMode); // true for fast mode (2x speed), false for normal
});
```

#### `game-state-update`
Fired when the game state changes (piece movement, line clears, etc.). Now includes live player scores.
```javascript
socket.on('game-state-update', (data) => {
  console.log('Game state updated:', data.gameState);
  console.log('Live player scores:', data.players);
  // Update your game display with new state and scores
});
```

#### `game-ended`
Fired when the game ends.
```javascript
socket.on('game-ended', (data) => {
  console.log('Game ended. Winner:', data.winner);
  console.log('Final state:', data.finalState);
});
```

#### `game-paused`
Fired when the game is paused.
```javascript
socket.on('game-paused', (data) => {
  console.log('Game paused:', data.reason);
});
```

#### `game-reset`
Fired when the game is reset.
```javascript
socket.on('game-reset', (data) => {
  console.log('Game reset. Players:', data.players);
});
```

#### `player-reconnected`
Fired when a player reconnects.
```javascript
socket.on('player-reconnected', (data) => {
  console.log('Player reconnected:', data.player);
});
```

#### `player-quit`
Fired when a player quits mid-game.
```javascript
socket.on('player-quit', (data) => {
  console.log('Player quit:', data.playerId, data.playerName);
});
```

#### `room-info`
Fired in response to `get-room-info` request.
```javascript
socket.on('room-info', (data) => {
  console.log('Room info:', data.room);
  console.log('Game state:', data.gameState);
});
```

#### `player-disconnected`
Fired when a player disconnects. May include host transfer information if the disconnected player was the host.
```javascript
socket.on('player-disconnected', (data) => {
  console.log('Player disconnected:', data.playerId, data.playerName);
  console.log('Can reconnect:', data.canReconnect);
  
  if (data.hostChanged) {
    console.log('Host transferred from', data.playerId, 'to', data.newHost.name);
  }
});
```

#### `host-changed`
Fired when room host is transferred to another player (e.g., when the current host disconnects).
```javascript
socket.on('host-changed', (data) => {
  console.log('Host changed from', data.previousHostName, 'to', data.newHostName);
  console.log('New host ID:', data.newHostId);
  console.log('Updated players:', data.players);
});
```

#### `reconnection-success`
Fired when reconnection is successful.
```javascript
socket.on('reconnection-success', (data) => {
  console.log('Reconnection successful:', data);
});
```

#### `reconnection-error`
Fired when reconnection fails.
```javascript
socket.on('reconnection-error', (error) => {
  console.error('Reconnection failed:', error);
});
```

#### `heartbeat-ack`
Fired in response to heartbeat.
```javascript
socket.on('heartbeat-ack', () => {
  console.log('Heartbeat acknowledged');
});
```

#### `chat-message`
Fired when a player sends a chat message.
```javascript
socket.on('chat-message', (data) => {
  console.log(`${data.playerName}: ${data.message}`);
  console.log('Timestamp:', data.timestamp);
});
```

#### `error`
Fired when an error occurs.
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### Game State Structure

The game state object contains:

```typescript
interface GameState {
  roomName: string;
  players: {
    [playerId: string]: {
      playerId: string;
      board: number[][]; // 20x10 grid, 0=empty, 1-7=piece types, 9=penalty
      currentPiece: {
        type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
        x: number;
        y: number;
        rotation: number;
        shape: number[][];
      } | null;
      nextPieces: Piece[]; // Array of upcoming pieces
      spectrum: number[]; // Height profile of columns
      lines: number; // Lines cleared
      score: number; // Player's current score
      level: number; // Current level (affects drop speed)
      isAlive: boolean;
      penalties: number; // Pending penalty lines
    };
  };
  gameOver: boolean;
  winner: string | null;
  startTime: number;
  fastMode: boolean; // true for fast mode (2x speed), false for normal
}
```

### Penalty System

- **Line clearing formula**: `n` lines cleared = `n-1` penalty lines sent to opponents
- **Penalty blocks**: Cannot be cleared and act as permanent obstacles
- **Penalty lines**: Push all pieces up when applied

### Error Handling

The server implements comprehensive error handling:

- **Connection errors**: Automatic reconnection with exponential backoff
- **Room errors**: Invalid room names, player limits, duplicate names
- **Game errors**: Invalid moves, timing issues, state desynchronization
- **Network errors**: Connection drops, timeout handling, heartbeat monitoring

### Rate Limiting

Game actions are rate-limited to prevent abuse:
- Movement actions: Max 10 per second
- Game state updates: Max 30 per second
- Heartbeat: Required every 30 seconds

### Security Features

- **Input validation**: All client inputs are validated and sanitized
- **Anti-cheat**: Server-side game state validation
- **Reconnection tokens**: Secure token-based reconnection
- **Rate limiting**: Prevents spam and DoS attacks

### Performance Optimization

- **Game loop**: Efficient 60 FPS game loop with delta time
- **State serialization**: Optimized JSON serialization for large game states
- **Memory management**: Automatic cleanup of disconnected players
- **Event batching**: Multiple updates batched into single emissions

### Implementation Details

#### Connection Management
```javascript
// Client connection with reconnection
const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
  timeout: 20000,
  forceNew: false
});
```

#### Game State Synchronization
The server maintains authoritative game state and broadcasts updates to all clients:
1. Client sends action request
2. Server validates and applies action
3. Server updates game state
4. Server broadcasts state to all room members
5. Clients render updated state

#### Penalty System Details
- **Triggering**: Clear 2+ lines simultaneously
- **Calculation**: Lines cleared - 1 = penalty lines sent
- **Distribution**: Penalty lines distributed to all opponents
- **Rendering**: Penalty blocks (value 9) are visually distinct
- **Mechanics**: Penalty lines push existing pieces up

#### Board Coordinates
- **Size**: 20 rows × 10 columns
- **Coordinate system**: (0,0) at top-left
- **Piece spawn**: Center-top of board
- **Line clearing**: Bottom-to-top evaluation

## Client Integration

### Socket.IO Client Setup

```javascript
import io from 'socket.io-client';

class TetrisClient {
  constructor() {
    this.socket = io('http://localhost:3001', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      timeout: 20000
    });
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('game-state-update', (data) => {
      this.updateGameState(data.gameState, data.players);
    });

    this.socket.on('chat-message', (data) => {
      this.displayChatMessage(data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinRoom(roomName, playerName) {
    this.socket.emit('join-room', { roomName, playerName });
  }

  sendGameAction(action) {
    this.socket.emit('game-action', { action });
  }

  sendChatMessage(message) {
    this.socket.emit('chat-message', { message });
  }

  // Leaderboard methods
  getLeaderboard(limit = 10) {
    this.socket.emit('get-leaderboard', { limit });
  }

  getPlayerStats(playerName) {
    this.socket.emit('get-player-stats', { playerName });
  }

  getLeaderboardStats() {
    this.socket.emit('get-leaderboard-stats', {});
  }

  submitScore(playerName, score, linesCleared, level, gameDuration, roomName) {
    this.socket.emit('submit-score', {
      playerName,
      score,
      linesCleared,
      level,
      gameDuration,
      roomName
    });
  }

  updateGameState(gameState, players) {
    // Update your game display with game state and live scores
    this.renderBoard(gameState.players[this.playerId].board);
    this.renderNextPiece(gameState.players[this.playerId].nextPieces[0]);
    this.updateSpectrum(gameState.players);
    this.updateLiveScores(players); // Show live player scores
  }

  displayChatMessage(chatData) {
    // Display chat message in your UI
    console.log(`[${chatData.timestamp}] ${chatData.playerName}: ${chatData.message}`);
    // Add to chat display, scroll to bottom, etc.
  }
}
```

### React Integration

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const TetrisGame = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('join-room-success', (data) => {
      setPlayerId(data.player.id);
    });

    newSocket.on('game-state-update', (data) => {
      setGameState(data.gameState);
      setPlayers(data.players); // Live player scores
    });

    return () => newSocket.close();
  }, []);

  const handleMove = (direction) => {
    if (socket) {
      socket.emit('game-action', { action: `move-${direction}` });
    }
  };

  return (
    <div>
      <TetrisBoard gameState={gameState} playerId={playerId} />
      <LiveScoreboard players={players} />
      <GameControls onMove={handleMove} />
    </div>
  );
};
```

### Best Practices

#### State Management
- **Server as Source of Truth**: Always validate client state against server
- **Optimistic Updates**: Apply moves immediately, rollback on server rejection
- **State Synchronization**: Regularly sync client state with server state

#### Performance Optimization
- **Throttle Input**: Limit game action frequency to prevent spam
- **Batch Updates**: Group multiple state changes into single renders
- **Memory Management**: Clean up event listeners on component unmount

#### Error Handling
- **Graceful Degradation**: Handle disconnections gracefully
- **Retry Logic**: Implement exponential backoff for failed requests
- **User Feedback**: Show connection status and errors to users

#### Security
- **Input Validation**: Validate all user inputs before sending
- **Rate Limiting**: Implement client-side rate limiting
- **Anti-Cheat**: Don't trust client-calculated scores or states

### Testing

#### Unit Tests
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- game.service.spec.ts

# Run tests with coverage
npm run test:cov
```

#### E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e
```

#### Manual Testing
Use the test clients for manual testing:
- **Basic client**: `/test/redtetristest.html`
- **Advanced client**: `/test/tetris-test-client.html`

### Monitoring and Logging

The server provides comprehensive logging:
- **Game events**: Piece movements, line clears, penalties
- **Player actions**: Joins, leaves, ready state changes
- **Performance metrics**: Game loop timing, memory usage
- **Error tracking**: All errors with stack traces and context

### Troubleshooting

#### Common Issues

**Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
- Check if server is running: `npm run start:dev`
- Verify port 3001 is available: `lsof -i :3001`
- Check firewall settings

**Game State Desynchronization**
- Client and server state don't match
- **Solution**: Implement client-side state validation
- **Prevention**: Use server as single source of truth

**Memory Leaks**
- High memory usage over time
- **Cause**: Rooms not properly cleaned up
- **Solution**: Implement proper room cleanup on disconnect

**High CPU Usage**
- Game loop consuming excessive CPU
- **Cause**: Inefficient game loop or too many rooms
- **Solution**: Optimize game loop, implement room limits

#### Debug Commands

```bash
# Check server health
curl http://localhost:3001/health

# View active connections
netstat -an | grep :3001

# Monitor memory usage
ps aux | grep node

# Check logs
tail -f logs/server.log
```

#### Performance Tuning

**Game Loop Optimization**
```javascript
// Adjust tick rate based on player count
const tickRate = Math.max(30, 60 - (playerCount * 2));
```

**Memory Management**
```javascript
// Clean up inactive rooms
setInterval(() => {
  this.cleanupInactiveRooms();
}, 60000); // Every minute
```

**Network Optimization**
```javascript
// Batch state updates
const batchedUpdates = this.batchStateUpdates(updates);
socket.emit('batch-update', batchedUpdates);
```

### Docker Deployment

#### Development
```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

#### Production
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Monitoring and Metrics

#### Health Checks
```javascript
// Health endpoint
@Get('/health')
async getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: this.roomService.getActiveRoomsCount(),
    totalPlayers: this.roomService.getTotalPlayersCount(),
    uptime: process.uptime()
  };
}
```

#### Performance Metrics
```javascript
// Monitor game loop performance
const startTime = process.hrtime();
await this.gameLoop();
const [seconds, nanoseconds] = process.hrtime(startTime);
const duration = seconds * 1000 + nanoseconds / 1000000;
console.log(`Game loop took ${duration}ms`);
```

### Error Handling

#### Client-Side Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  // Attempt reconnection
  setTimeout(() => {
    socket.connect();
  }, 1000);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  // Save game state locally
  localStorage.setItem('gameState', JSON.stringify(currentState));
});
```

#### Server-Side Error Handling
```javascript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    
    client.emit('error', {
      message: 'An error occurred',
      timestamp: new Date().toISOString()
    });
  }
}
```

### Configuration

Environment variables:
```bash
# Server configuration
PORT=3001
NODE_ENV=development

# Game configuration
GAME_TICK_RATE=60
MAX_PLAYERS_PER_ROOM=5
HEARTBEAT_INTERVAL=30000
```

### Test Client

A test client is available at `/test/tetris-test-client.html` for testing the WebSocket API and game functionality.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
