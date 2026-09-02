import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Controller('api')
export class AppController {
  // สร้างตัวแปรสมุดจดคิวเอาไว้ใน Memory 
  private messageQueue: any[] = [];

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Get('customers')
  async getAllCustomers() {
    const customers = await this.customerRepository.find({
      order: { createdAt: 'DESC' },
    });
    
    return customers.map(cust => {
      let cleanName = cust.displayName;
      if (cleanName && cleanName.includes(' ')) {
        cleanName = cleanName.substring(cleanName.indexOf(' ') + 1).trim();
      }
      return {
        ...cust,
        cleanedDisplayName: cleanName || 'ลูกค้า'
      };
    });
  }

  // 1. API รับแคมเปญจากหน้า Dashboard
  @Post('campaign/add')
  addCampaign(@Body() body: { targetIds: string[], message: string }) {
    // เอาข้อมูลเป้าหมายมาแปลงเป็นคิวงาน
    const jobs = body.targetIds.map(id => ({ 
      userId: id, 
      message: body.message, 
      status: 'pending' 
    }));
    
    // เอาไปต่อท้ายในคิว
    this.messageQueue.push(...jobs);
    console.log(`📥 รับคิวงานใหม่: ${jobs.length} รายการ (รวมคิวรอส่งทั้งหมด: ${this.messageQueue.filter(q => q.status === 'pending').length})`);
    
    return { success: true, queuedCount: jobs.length };
  }

  // 2. API สำหรับ Tampermonkey มาขอรับคิวไปส่ง
  @Get('campaign/next')
  getNextJob() {
    // หาคิวที่ยังไม่ได้ส่ง (pending) มา 1 คิว
    const job = this.messageQueue.find(j => j.status === 'pending');
    if (job) {
      job.status = 'processing'; // เปลี่ยนสถานะว่ากำลังส่ง จะได้ไม่ส่งซ้ำ
      return job;
    }
    return { status: 'empty' }; // ถ้าไม่มีคิวแล้วให้ส่งค่านี้กลับไป
  }


  // 3. API สำหรับ Tampermonkey มารายงานว่าส่งเสร็จแล้ว
  @Post('campaign/success')
  markSuccess(@Body() body: { userId: string }) {
    const job = this.messageQueue.find(j => j.userId === body.userId);
    if (job) {
      job.status = 'success';
      console.log(`✅ ส่งข้อความสำเร็จ: ${body.userId}`);
    }
    return { success: true };

  }

}

