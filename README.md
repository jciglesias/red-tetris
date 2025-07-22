# Red Tetris

A networked multiplayer Tetris game built with NestJS and React.

## Project Structure

```
red-tetris/
├── server/          # NestJS backend
├── client/          # React frontend
├── docs/           # Documentation
└── tests/          # Integration tests
```

## Requirements

- Node.js 18+
- npm 8+

## Quick Start Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run start
   ```

3. Test:
   ```bash
   npm run test
   npm run test:cov
   ```

## Quick Start Client

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run start
   ```

3. Test:
   ```bash
   npm run test
   npm run test:cov
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


## Game Rules

- 10x20 playing field
- Standard Tetris pieces and rotation
- Multiplayer support via rooms
- Real-time spectrum view
- Penalty lines for cleared lines

## URL Format

Join a game: `http://localhost:3000/<room>?/<player_name>`

Example: `http://localhost:3000/room1/player1`


## Starting scripts

npx create-react-app client --template typescript
npx @nestjs/cli new server --package-manager npm --skip-git
