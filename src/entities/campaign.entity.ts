import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  botId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 50, default: 'text' })
  messageType: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  linkUrl: string | null;

  @Column({ type: 'int', default: 0 })
  totalTargets: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'stopped_limit' | 'stopped_error' | 'paused' | 'stopped_user'

  @Column({ type: 'timestamp without time zone', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  startedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
