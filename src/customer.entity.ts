import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers') // ชี้ไปที่ตาราง customers ที่มีอยู่แล้ว
export class Customer {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  botId: string;

  @PrimaryColumn({ type: 'varchar', length: 64 })
  lineUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  pictureUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  statusMessage: string;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'text', nullable: true })
  blockReason: string;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;
}