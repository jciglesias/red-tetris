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
- **Penalty system** - clearing multiple lines sends penalty blocks to opponents
- **Reconnection support** with game state restoration
- **Spectrum view** showing opponent's board height profile
- **Full game state synchronization** across all clients

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
| `start-game` | `{}` | Start the game | `{}` |
| `game-action` | `{ action: string }` | Send game action | `{ action: "move-left" }` |
| `restart-game` | `{}` | Restart current game | `{}` |
| `get-room-info` | `{}` | Get room information | `{}` |
| `heartbeat` | `{ timestamp: number }` | Send heartbeat | `{ timestamp: 1234567890 }` |
| `request-reconnection` | `{ reconnectionToken: string }` | Request reconnection | `{ reconnectionToken: "abc123" }` |

#### Server → Client Events

| Event | Data | Description | Example |
|-------|------|-------------|---------|
| `join-room-success` | `{ room: string, player: object, gameState?: object, isReconnection: boolean }` | Successfully joined room | See example below |
| `join-room-error` | `{ message: string, code: string }` | Failed to join room | `{ message: "Room is full", code: "ROOM_FULL" }` |
| `player-joined` | `{ player: object, players: object[] }` | Player joined room | See example below |
| `player-left` | `{ player: object, players: object[] }` | Player left room | See example below |
| `player-ready-changed` | `{ playerId: string, ready: boolean }` | Player ready state changed | `{ playerId: "player1", ready: true }` |
| `game-started` | `gameState: object` | Game started | See GameState structure |
| `game-state-update` | `gameState: object` | Game state updated | See GameState structure |
| `game-ended` | `{ winner: string, scores: object }` | Game ended | `{ winner: "player1", scores: {...} }` |
| `game-paused` | `{ reason: string }` | Game paused | `{ reason: "player_disconnected" }` |
| `game-reset` | `{ reason: string }` | Game reset | `{ reason: "player_request" }` |
| `player-reconnected` | `{ player: object }` | Player reconnected | See example below |
| `reconnection-success` | `{ player: object, gameState: object }` | Reconnection successful | See example below |
| `reconnection-error` | `{ message: string, code: string }` | Reconnection failed | `{ message: "Invalid token", code: "INVALID_TOKEN" }` |
| `heartbeat-ack` | `{}` | Heartbeat acknowledged | `{}` |
| `error` | `{ message: string, code?: string }` | Error occurred | `{ message: "Invalid action", code: "INVALID_ACTION" }` |

### Game Actions

| Action | Description | When Available |
|--------|-------------|---------------|
| `move-left` | Move piece left | During active game |
| `move-right` | Move piece right | During active game |
| `rotate` | Rotate piece clockwise | During active game |
| `soft-drop` | Accelerate piece down | During active game |
| `hard-drop` | Instantly drop piece | During active game |

### Data Structures

#### Player Object
```typescript
interface Player {
  id: string;
  name: string;
  ready: boolean;
  reconnectionToken: string;
  isAlive: boolean;
  lines: number;
  penalties: number;
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
      isAlive: boolean;
      penalties: number;
    };
  };
  gameOver: boolean;
  winner: string | null;
  startTime: number;
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

### Error Codes

| Code | Description | Action |
|------|-------------|---------|
| `ROOM_FULL` | Room has reached maximum capacity | Try different room |
| `INVALID_NAME` | Player name is invalid or taken | Choose different name |
| `GAME_IN_PROGRESS` | Cannot join room with active game | Wait for game to end |
| `INVALID_ACTION` | Game action is not valid | Check game state |
| `NOT_READY` | Cannot start game, not all players ready | Wait for all players |
| `INVALID_TOKEN` | Reconnection token is invalid | Rejoin room |
| `RATE_LIMITED` | Too many requests | Slow down requests |

### Response Examples

#### join-room-success
```json
{
  "room": "room1",
  "player": {
    "id": "player1",
    "name": "Player 1",
    "ready": false,
    "reconnectionToken": "abc123def456",
    "isAlive": true,
    "lines": 0,
    "penalties": 0
  },
  "gameState": null,
  "isReconnection": false
}
```

#### player-joined
```json
{
  "player": {
    "id": "player2",
    "name": "Player 2",
    "ready": false
  },
  "players": [
    {
      "id": "player1",
      "name": "Player 1",
      "ready": true
    },
    {
      "id": "player2",
      "name": "Player 2",
      "ready": false
    }
  ]
}
```

#### game-state-update
```json
{
  "roomName": "room1",
  "players": {
    "player1": {
      "playerId": "player1",
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
      "isAlive": true,
      "penalties": 0
    }
  },
  "gameOver": false,
  "winner": null,
  "startTime": 1234567890
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
Start the game (only works if all players are ready).
```javascript
socket.emit('start-game');
```

#### `game-action`
Send game actions (movement, rotation, dropping).
```javascript
socket.emit('game-action', {
  action: 'move-left' | 'move-right' | 'rotate' | 'soft-drop' | 'hard-drop'
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
socket.emit('heartbeat', {
  timestamp: Date.now()
});
```

#### `request-reconnection`
Request reconnection with a token.
```javascript
socket.emit('request-reconnection', {
  reconnectionToken: 'your-token'
});
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

#### `player-left`
Fired when a player leaves the room.
```javascript
socket.on('player-left', (data) => {
  console.log('Player left:', data.player);
  console.log('Remaining players:', data.players);
});
```

#### `player-ready-changed`
Fired when a player's ready state changes.
```javascript
socket.on('player-ready-changed', (data) => {
  console.log('Player ready changed:', data.playerId, data.ready);
});
```

#### `game-started`
Fired when the game starts.
```javascript
socket.on('game-started', (gameState) => {
  console.log('Game started with state:', gameState);
  // gameState contains full game state including all players' boards
});
```

#### `game-state-update`
Fired when the game state changes (piece movement, line clears, etc.).
```javascript
socket.on('game-state-update', (gameState) => {
  console.log('Game state updated:', gameState);
  // Update your game display with new state
});
```

#### `game-ended`
Fired when the game ends.
```javascript
socket.on('game-ended', (data) => {
  console.log('Game ended. Winner:', data.winner);
  console.log('Final scores:', data.scores);
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
  console.log('Game reset:', data.reason);
});
```

#### `player-reconnected`
Fired when a player reconnects.
```javascript
socket.on('player-reconnected', (data) => {
  console.log('Player reconnected:', data.player);
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
      isAlive: boolean;
      penalties: number; // Pending penalty lines
    };
  };
  gameOver: boolean;
  winner: string | null;
  startTime: number;
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

    this.socket.on('game-state-update', (gameState) => {
      this.updateGameState(gameState);
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

  updateGameState(gameState) {
    // Update your game display
    this.renderBoard(gameState.players[this.playerId].board);
    this.renderNextPiece(gameState.players[this.playerId].nextPieces[0]);
    this.updateSpectrum(gameState.players);
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
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('join-room-success', (data) => {
      setPlayerId(data.player.id);
    });

    newSocket.on('game-state-update', (state) => {
      setGameState(state);
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
