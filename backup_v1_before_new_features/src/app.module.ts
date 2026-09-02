import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { AppController } from './app.controller'; // 👈 1. เพิ่มบรรทัดนี้

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres', // เปลี่ยนเป็น username ของคุณถ้าตั้งไว้เป็นชื่ออื่น
      password: 'pg@1234', // แก้เป็นรหัสผ่าน PostgreSQL ของคุณ
      database: 'line_sync_db', // ชื่อฐานข้อมูลโปรเจกต์ของคุณ[cite: 2]
      entities: [Customer],
      synchronize: false, // ⚠️ สำคัญมาก: กำหนดเป็น false เพื่อป้องกันไม่ให้ NestJS ไปสร้างตารางใหม่ทับข้อมูลเดิม[cite: 2]
    }),
    TypeOrmModule.forFeature([Customer]),
  ],
  controllers: [AppController], // 👈 2. เพิ่มบรรทัดนี้เพื่อให้ NestJS รู้จัก API
})
export class AppModule {}