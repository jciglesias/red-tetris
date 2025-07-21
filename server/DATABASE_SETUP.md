# Red Tetris - Database Setup

This project now includes PostgreSQL database integration with TypeORM for managing leaderboard data.

## Database Setup

### Features
- PostgreSQL database with automatic table creation
- Leaderboard tracking with the following data:
  - Player name
  - Score
  - Lines cleared
  - Level reached
  - Game duration
  - Room name (optional)
  - Timestamp

### Database Configuration

The database connection is configured in `src/app.module.ts` with the following environment variables:

- `POSTGRES_HOST` (default: 'postgres')
- `POSTGRES_PORT` (default: 5432)
- `POSTGRES_USER` (default: 'admin')
- `POSTGRES_PASSWORD` (default: 'admin')
- `POSTGRES_DB` (default: 'red_tetris')

### Auto-Table Creation

The application uses TypeORM's `synchronize: true` setting, which automatically creates the necessary database tables when the server starts. This includes:

- `leaderboard` table with all necessary columns
- Automatic indexing and relationships

**Note**: In production, you should set `synchronize: false` and use proper database migrations.

## API Endpoints

### Leaderboard Endpoints

- `POST /api/leaderboard` - Add a new leaderboard entry
- `GET /api/leaderboard/top?limit=10` - Get top scores (default limit: 10)
- `GET /api/leaderboard/player?name=PlayerName` - Get best score for a specific player
- `GET /api/leaderboard/stats` - Get all-time statistics

### Health Check

- `GET /health` - Check server and database connection status

## Usage

1. Start the services:
   ```bash
   docker-compose up
   ```

2. The database will be automatically initialized when the server starts.

3. You can access:
   - Application: http://localhost:3000
   - PgAdmin: http://localhost:5050 (admin@example.com / SuperSecret)
   - Database health: http://localhost:3001/health

## Database Access

### PgAdmin
- URL: http://localhost:5050
- Email: admin@example.com
- Password: SuperSecret

### Database Connection Details
- Host: localhost (or postgres from within containers)
- Port: 5432
- Database: red_tetris
- Username: admin
- Password: admin

## Development

The server includes TypeORM logging in development mode to help debug database queries.

## Example Usage

```typescript
// Add a leaderboard entry
const entry = await leaderboardService.addEntry({
  playerName: 'Alice',
  score: 15000,
  linesCleared: 75,
  level: 8,
  gameDuration: 300.5,
  roomName: 'GameRoom1'
});

// Get top 5 scores
const topScores = await leaderboardService.getTopScores(5);

// Get player's best score
const bestScore = await leaderboardService.getPlayerBestScore('Alice');

// Get all-time statistics
const stats = await leaderboardService.getAllTimeStats();
```
