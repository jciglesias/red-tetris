import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('leaderboard')
export class LeaderboardEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  playerName: string;

  @Column()
  score: number;

  @Column()
  linesCleared: number;

  @Column()
  level: number;

  @Column({ type: 'float' })
  gameDuration: number; // in seconds

  @CreateDateColumn()
  createdAt: Date;

  @Column({ length: 50, nullable: true })
  roomName?: string;
}
