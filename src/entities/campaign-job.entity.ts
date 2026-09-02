import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('campaign_jobs')
export class CampaignJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  campaignId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  botId: string | null;

  @Column({ type: 'varchar', length: 50 })
  lineUserId: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorReason: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
