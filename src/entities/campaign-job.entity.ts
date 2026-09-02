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

  @Column({ type: 'varchar', length: 64, nullable: true })
  leaseToken: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  leaseOwner: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  leaseExpiresAt: Date | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  leaseHeartbeatAt: Date | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
