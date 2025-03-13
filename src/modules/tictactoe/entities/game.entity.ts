import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BoardState = Array<Array<'X' | 'O' | ''>>;

@Entity('games')
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json')
  board: BoardState;

  @Column()
  playerX: string;

  @Column({ nullable: true })
  playerO: string;

  @Column({ nullable: true })
  winner: 'X' | 'O' | 'DRAW' | null;

  @Column()
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
