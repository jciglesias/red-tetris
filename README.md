# Red Tetris

A networked multiplayer Tetris game built with NestJS and React.

## Project Structure

```
red-tetris/
├── server/          # NestJS backend
├── client/          # React frontend
├── shared/          # Shared types and utilities
├── docs/           # Documentation
└── tests/          # Integration tests
```

## Requirements

- Node.js 18+
- npm 8+

## Quick Start

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Start development servers:
   ```bash
   npm run start:dev
   ```

3. Open your browser to `http://localhost:3000`

## Development

### Server (NestJS)
- Port: 3001
- WebSocket: socket.io
- Location: `./server`

### Client (React)
- Port: 3000
- Framework: React with hooks
- State management: Redux Toolkit
- Location: `./client`

### Shared
- TypeScript interfaces
- Game constants
- Utility functions
- Location: `./shared`

## Testing

Run all tests:
```bash
npm run test
```

Run with coverage:
```bash
npm run test:coverage
```

## Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Game Rules

- 10x20 playing field
- Standard Tetris pieces and rotation
- Multiplayer support via rooms
- Real-time spectrum view
- Penalty lines for cleared lines

## URL Format

Join a game: `http://localhost:3000/<room>/<player_name>`

Example: `http://localhost:3000/room1/alice`
