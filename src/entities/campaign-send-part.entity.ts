import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('campaign_send_parts')
@Unique(['jobId', 'partKey'])
@Index(['botId', 'status'])
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

  @Column({ type: 'varchar', length: 50 })
  partKey: string; // 'image' | 'text'

  @Column({ type: 'integer', default: 0 })
  partOrder: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  armRequestId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  dispatchToken: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  dispatchOwner: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  armedAt: Date | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  dispatchedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reconcileReason: string | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // 'pending' | 'armed' | 'dispatched' | 'reconcile_required'

  // Legacy compatibility fields (REL-WP003 -> R2)
  @Column({ type: 'integer', nullable: true })
  partIndex?: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  partType?: string | null;

  @Column({ type: 'integer', nullable: true })
  totalParts?: number | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  sentAt?: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  leaseToken?: string | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
