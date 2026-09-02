import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers') // ชี้ไปที่ตาราง customers ที่มีอยู่แล้ว[cite: 2]
export class Customer {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  lineUserId: string; //[cite: 2]

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string; //[cite: 2]

  @Column({ type: 'text', nullable: true })
  pictureUrl: string; //[cite: 2]

  @Column({ type: 'varchar', length: 255, nullable: true })
  statusMessage: string; //[cite: 2]

  @Column({ type: 'varchar', nullable: true })
  botId: string; //[cite: 2]

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date; //[cite: 2]

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updatedAt: Date; //[cite: 2]
}