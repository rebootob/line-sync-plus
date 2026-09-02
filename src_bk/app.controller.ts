import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Controller('api/customers')
export class AppController {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Get()
  async getAllCustomers() {
    // ดึงข้อมูลรายชื่อจากฐานข้อมูลทั้งหมด
    const customers = await this.customerRepository.find({
      order: { createdAt: 'DESC' }, // เรียงจากคนล่าสุดที่ถูก Sync เข้ามา
    });
    
    // แปลงข้อมูลเพื่อเอา "รหัส" หน้าชื่อออกก่อนส่งให้หน้าเว็บ
    return customers.map(cust => {
      let cleanName = cust.displayName;
      if (cleanName && cleanName.includes(' ')) {
        // ตัดข้อความทุกอย่างที่อยู่หลังช่องว่างตัวแรก
        cleanName = cleanName.substring(cleanName.indexOf(' ') + 1).trim();
      }
      return {
        ...cust,
        cleanedDisplayName: cleanName || 'ลูกค้า' // ถ้าไม่มีชื่อให้ใช้คำว่า 'ลูกค้า' แทน
      };
    });
  }
}