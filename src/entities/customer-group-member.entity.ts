import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customer_group_members')
export class CustomerGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  groupId: string;

  @Column({ type: 'varchar', length: 50 })
  lineUserId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  botId: string | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;
}
