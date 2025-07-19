import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeaderboardService } from './leaderboard/leaderboard.service';

async function testDatabaseConnection() {
  const app = await NestFactory.create(AppModule);
  
  try {
    const leaderboardService = app.get(LeaderboardService);
    
    // Test adding a sample entry
    console.log('Testing database connection...');
    
    const sampleEntry = await leaderboardService.addEntry({
      playerName: 'TestPlayer',
      score: 1000,
      linesCleared: 50,
      level: 5,
      gameDuration: 120.5,
      roomName: 'TestRoom'
    });
    
    console.log('Sample entry added:', sampleEntry);
    
    // Test retrieving top scores
    const topScores = await leaderboardService.getTopScores(5);
    console.log('Top scores:', topScores);
    
    // Test getting stats
    const stats = await leaderboardService.getAllTimeStats();
    console.log('All-time stats:', stats);
    
    console.log('Database connection test successful!');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
  
  await app.close();
}

// Only run if this file is executed directly
if (require.main === module) {
  testDatabaseConnection();
}
