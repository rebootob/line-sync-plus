import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('oa_runtime_state')
export class OaRuntimeState {
  @PrimaryColumn({ type: 'varchar', length: 64, default: 'global' })
  id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  activeBotId: string | null;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;
}
