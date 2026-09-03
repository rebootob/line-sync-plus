import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('campaign_send_parts')
@Unique(['jobId', 'partIndex'])
export class CampaignSendPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'varchar', length: 255 })
  campaignId: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  botId: string;

  @Column({ type: 'varchar', length: 50 })
  lineUserId: string;

  @Column({ type: 'integer', default: 0 })
  partIndex: number;

  @Column({ type: 'varchar', length: 50 })
  partType: string;

  @Column({ type: 'integer', default: 1 })
  totalParts: number;

  @Column({ type: 'varchar', length: 50, default: 'sent' })
  status: string;

  @Column({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  leaseToken: string | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
