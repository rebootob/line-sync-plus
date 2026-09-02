import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customer_group_members')
export class CustomerGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  groupId: string;

  @Column({ type: 'varchar', length: 50 })
  lineUserId: string;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;
}
