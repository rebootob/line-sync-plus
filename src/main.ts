import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // เพิ่มขนาด Request Body Limit รองรับการอัปโหลดไฟล์รูปภาพขนาดใหญ่จากเครื่อง (สูงสุด 50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // เปิดใช้งาน CORS เพื่อให้หน้าเว็บยิง API เข้ามาดึงข้อมูลได้
  app.enableCors();
  
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 LineSync Plus Backend is running on: http://localhost:${port}`);
}
bootstrap();