import { Controller, Get, Post, Delete, Body, Param, NotFoundException, Res, Req, Headers, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Customer } from './customer.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerGroupMember } from './entities/customer-group-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignJob } from './entities/campaign-job.entity';
import { TelegramService, TelegramConfig } from './telegram.service';
import { RUNTIME_CONTRACT_VERSION, REQUIRED_WORKER_VERSION } from './runtime-version';

@Controller('api')
export class AppController {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,

    @InjectRepository(CustomerGroup)
    private groupRepository: Repository<CustomerGroup>,

    @InjectRepository(CustomerGroupMember)
    private groupMemberRepository: Repository<CustomerGroupMember>,

    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,

    @InjectRepository(CampaignJob)
    private campaignJobRepository: Repository<CampaignJob>,

    private telegramService: TelegramService,
  ) {}

  // 1. ดึงรายชื่อลูกค้าทั้งหมดพร้อมจัดรูปแบบชื่อ และสถานะบล็อก
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
        cleanedDisplayName: cleanName || 'ลูกค้า',
        isBlocked: cust.isBlocked || false,
        blockReason: cust.blockReason || null,
      };
    });
  }

  // 1.1 อัปโหลดรูปภาพจากเครื่องคอมพิวเตอร์ Local บันทึกลงเซิร์ฟเวอร์
  @Post('upload/image')
  async uploadImage(@Body() body: { base64: string; filename?: string }) {
    if (!body.base64) {
      return { success: false, message: 'ไม่มีข้อมูลรูปภาพ' };
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const rawFilename = body.filename || 'local_image.png';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const savedFilename = `${Date.now()}_${cleanFilename}`;
    const filePath = path.join(uploadsDir, savedFilename);

    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 3005;
    const fileUrl = `http://localhost:${port}/api/uploads/${savedFilename}`;
    console.log(`📸 บันทึกรูปภาพ Local สำเร็จ: ${fileUrl}`);

    return {
      success: true,
      url: fileUrl,
      filename: savedFilename,
    };
  }

  // 1.2 ให้บริการดึงไฟล์รูปภาพ Local
  @Get('uploads/:filename')
  serveUpload(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('ไม่พบไฟล์รูปภาพที่ระบุ');
    }
    return res.sendFile(filePath);
  }

  // ==========================================
  // 2. ระบบจัดการกลุ่มลูกค้า (Customer Group APIs)
  // ==========================================

  // ดึงรายการกลุ่มทั้งหมดพร้อมจำนวนสมาชิก
  @Get('groups')
  async getAllGroups() {
    const groups = await this.groupRepository.find({
      order: { createdAt: 'DESC' },
    });

    const result = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.groupMemberRepository.count({
          where: { groupId: group.id },
        });
        return {
          ...group,
          memberCount,
        };
      }),
    );

    return result;
  }

  // ดึงรายชื่อสมาชิกในกลุ่มเฉพาะ ID
  @Get('groups/:id')
  async getGroupDetail(@Param('id') id: string) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('ไม่พบกลุ่มลูกค้าที่ระบุ');
    }
    const members = await this.groupMemberRepository.find({
      where: { groupId: id },
    });
    return {
      group,
      targetIds: members.map(m => m.lineUserId),
    };
  }

  // สร้างกลุ่มใหม่พร้อมรายชื่อสมาชิก
  @Post('groups')
  async createGroup(
    @Body() body: { name: string; description?: string; targetIds: string[] },
  ) {
    if (!body.name || !body.targetIds || body.targetIds.length === 0) {
      return { success: false, message: 'กรุณาระบุชื่อกลุ่มและเลือกสมาชิกอย่างน้อย 1 คน' };
    }

    const group = this.groupRepository.create({
      name: body.name.trim(),
      description: body.description ? body.description.trim() : null,
    });
    const savedGroup = await this.groupRepository.save(group);

    const members = body.targetIds.map(userId =>
      this.groupMemberRepository.create({
        groupId: savedGroup.id,
        lineUserId: userId,
      }),
    );
    await this.groupMemberRepository.save(members);

    return {
      success: true,
      group: savedGroup,
      memberCount: members.length,
    };
  }

  // ลบกลุ่มลูกค้า
  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string) {
    await this.groupMemberRepository.delete({ groupId: id });
    await this.groupRepository.delete(id);
    return { success: true };
  }

  // ==========================================
  // 3. ระบบจัดการแคมเปญส่งข้อความ (Campaign & DB Queue APIs)
  // ==========================================

  // สร้างแคมเปญและสร้างคิวงานในฐานข้อมูล (รองรับ Scheduled Time & Multi-type)
  @Post('campaign/add')
  async addCampaign(
    @Body()
    body: {
      name?: string;
      messageType?: string;
      message: string;
      imageUrl?: string;
      linkUrl?: string;
      targetIds: string[];
      scheduledAt?: string; // ISO string date-time
    },
  ) {
    if (!body.targetIds || body.targetIds.length === 0) {
      return { success: false, message: 'ไม่มีรายชื่อเป้าหมาย' };
    }

    const messageType = body.messageType || 'text';
    const campaignName = body.name || `แคมเปญ ${new Date().toLocaleString('th-TH')}`;

    let scheduledDate: Date | null = null;
    let initialStatus = 'pending';

    if (body.scheduledAt && body.scheduledAt.trim() !== '') {
      const parsedDate = new Date(body.scheduledAt);
      if (!isNaN(parsedDate.getTime())) {
        scheduledDate = parsedDate;
        if (parsedDate.getTime() > Date.now()) {
          initialStatus = 'scheduled';
        }
      }
    }

    // สร้าง Record แคมเปญใน DB
    const campaign = this.campaignRepository.create({
      name: campaignName,
      messageType: messageType,
      message: body.message,
      imageUrl: body.imageUrl || null,
      linkUrl: body.linkUrl || null,
      totalTargets: body.targetIds.length,
      successCount: 0,
      failedCount: 0,
      status: initialStatus,
      scheduledAt: scheduledDate,
    });
    const savedCampaign = await this.campaignRepository.save(campaign);

    // สร้าง Record คิวงานรายบุคคลใน DB
    const jobs = body.targetIds.map(userId =>
      this.campaignJobRepository.create({
        campaignId: savedCampaign.id,
        lineUserId: userId,
        status: 'pending',
      }),
    );
    await this.campaignJobRepository.save(jobs);

    console.log(`📥 บันทึกแคมเปญลง DB เรียบร้อย: "${savedCampaign.name}" (${jobs.length} รายการ, สถานะ: ${initialStatus})`);

    return {
      success: true,
      campaignId: savedCampaign.id,
      queuedCount: jobs.length,
      status: initialStatus,
      scheduledAt: scheduledDate,
    };
  }

  private static isBotEnabled = true;

  // API เช็คและเปิด-ปิดสวิตช์หลักของบอท (Master Bot Switch)
  @Get('bot/status')
  getBotStatus() {
    return { enabled: AppController.isBotEnabled };
  }

  @Post('bot/toggle')
  toggleBotStatus(@Body() body?: { enabled?: boolean }) {
    if (body && typeof body.enabled === 'boolean') {
      AppController.isBotEnabled = body.enabled;
    } else {
      AppController.isBotEnabled = !AppController.isBotEnabled;
    }
    console.log(`🤖 สถานะ Master Bot: ${AppController.isBotEnabled ? '🟢 เปิดทำงานปกติ' : '🔴 พักการทำงานชั่วคราว'}`);
    return { success: true, enabled: AppController.isBotEnabled };
  }

  // API สำหรับตรวจสอบเวอร์ชัน Runtime Contract และ Worker Version ที่ต้องการ (OPS-WP001)
  @Get('runtime/version')
  getRuntimeVersion() {
    return {
      runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
      requiredWorkerVersion: REQUIRED_WORKER_VERSION,
    };
  }

  // API สำหรับ Tampermonkey มาขอรับคิวงานถัดไปจาก DB (พร้อมระบบ Scheduled & Stale Recovery)
  @Get('campaign/next')
  async getNextJob(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'version_mismatch',
        requiredWorkerVersion: REQUIRED_WORKER_VERSION,
      };
    }

    if (!AppController.isBotEnabled) {
      return { status: 'empty', reason: 'Master Bot is Paused' };
    }

    const pendingJobs = await this.campaignJobRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    let selectedJob: CampaignJob | null = null;
    let targetCampaign: Campaign | null = null;
    const nowMs = Date.now();

    const readyCandidates: { job: CampaignJob; campaign: Campaign }[] = [];

    for (const j of pendingJobs) {
      const camp = await this.campaignRepository.findOne({ where: { id: j.campaignId } });
      if (!camp) continue;

      // หากแคมเปญถูกสั่งหยุด หรือ หยุดชั่วคราว (โควต้าเต็ม / Error เกินกำหนด / ผู้ใช้สั่งหยุด / Paused) ให้ข้าม
      if (['stopped_limit', 'stopped_error', 'stopped_user', 'paused', 'failed', 'completed'].includes(camp.status)) continue;

      // หากตั้งเวลาส่งล่วงหน้า แล้วยังไม่ถึงเวลา ให้ข้าม
      if (camp.scheduledAt && new Date(camp.scheduledAt).getTime() > nowMs) continue;

      readyCandidates.push({ job: j, campaign: camp });
    }

    // เรียงตามลำดับเวลา scheduledAt ก่อน (ถ้าระบุ) แล้วตามด้วย createdAt
    readyCandidates.sort((a, b) => {
      const timeA = a.campaign.scheduledAt ? new Date(a.campaign.scheduledAt).getTime() : new Date(a.campaign.createdAt).getTime();
      const timeB = b.campaign.scheduledAt ? new Date(b.campaign.scheduledAt).getTime() : new Date(b.campaign.createdAt).getTime();
      return timeA - timeB;
    });

    if (readyCandidates.length > 0) {
      selectedJob = readyCandidates[0].job;
      targetCampaign = readyCandidates[0].campaign;

      if (!targetCampaign.startedAt) {
        targetCampaign.startedAt = new Date();
        if (['scheduled', 'pending'].includes(targetCampaign.status)) {
          targetCampaign.status = 'processing';
        }
        await this.campaignRepository.save(targetCampaign);
      }
    }

    // หากไม่มี pending ที่พร้อมรัน ให้ลองหาคิวที่ค้างในสถานะ processing เกิน 15 วินาที (Stale Job Recovery)
    if (!selectedJob) {
      const staleTime = new Date(Date.now() - 15 * 1000);
      const processingJobs = await this.campaignJobRepository.find({
        where: { status: 'processing', updatedAt: LessThan(staleTime) },
        order: { updatedAt: 'ASC' },
        take: 20,
      });

      for (const j of processingJobs) {
        const camp = await this.campaignRepository.findOne({ where: { id: j.campaignId } });
        if (!camp || ['stopped_limit', 'stopped_error', 'stopped_user', 'paused', 'failed', 'completed'].includes(camp.status)) continue;
        if (camp.scheduledAt && new Date(camp.scheduledAt).getTime() > nowMs) continue;

        selectedJob = j;
        targetCampaign = camp;
        break;
      }
    }

    if (!selectedJob || !targetCampaign) {
      return { status: 'empty' };
    }

    // เปลี่ยนสถานะเป็น processing
    selectedJob.status = 'processing';
    await this.campaignJobRepository.save(selectedJob);

    if (targetCampaign.status === 'pending' || targetCampaign.status === 'scheduled') {
      targetCampaign.status = 'processing';
      await this.campaignRepository.save(targetCampaign);
    }

    return {
      jobId: selectedJob.id,
      campaignId: selectedJob.campaignId,
      userId: selectedJob.lineUserId,
      messageType: targetCampaign.messageType || 'text',
      message: targetCampaign.message || '',
      imageUrl: targetCampaign.imageUrl || null,
      linkUrl: targetCampaign.linkUrl || null,
      status: 'processing',
    };
  }

  // API สำหรับ Tampermonkey มารายงานว่าส่งเสร็จแล้ว
  @Post('campaign/success')
  async markSuccess(@Body() body: { jobId?: string; userId?: string }) {
    let job: CampaignJob | null = null;

    if (body.jobId) {
      job = await this.campaignJobRepository.findOne({ where: { id: body.jobId } });
    } else if (body.userId) {
      job = await this.campaignJobRepository.findOne({
        where: { lineUserId: body.userId, status: 'processing' },
        order: { updatedAt: 'DESC' },
      });
    }

    if (job) {
      job.status = 'success';
      job.sentAt = new Date();
      await this.campaignJobRepository.save(job);

      // อัปเดตตัวนับสำเร็จในแคมเปญหลัก
      const campaign = await this.campaignRepository.findOne({ where: { id: job.campaignId } });
      if (campaign) {
        campaign.successCount += 1;
        
        // เช็คว่าคิวงานทั้งหมดเสร็จหรือยัง
        const remainingPending = await this.campaignJobRepository.count({
          where: [
            { campaignId: campaign.id, status: 'pending' },
            { campaignId: campaign.id, status: 'processing' },
          ],
        });

        if (remainingPending === 0) {
          campaign.status = 'completed';
          await this.campaignRepository.save(campaign);
          await this.checkAndSendTelegramReport(campaign);
        } else {
          await this.campaignRepository.save(campaign);
        }
      }

      console.log(`✅ ส่งข้อความสำเร็จ: ${job.lineUserId}`);
    }

    return { success: true };
  }

  // API สำหรับ Tampermonkey มารายงานว่าส่งล้มเหลว (พร้อมอัปเดตปิดสถานะผู้ใช้บล็อก/ส่งไม่ได้)
  @Post('campaign/fail')
  async markFail(@Body() body: { jobId?: string; userId?: string; reason?: string; isBlocked?: boolean }) {
    let job: CampaignJob | null = null;

    if (body.jobId) {
      job = await this.campaignJobRepository.findOne({ where: { id: body.jobId } });
    } else if (body.userId) {
      job = await this.campaignJobRepository.findOne({
        where: { lineUserId: body.userId, status: 'processing' },
        order: { updatedAt: 'DESC' },
      });
    }

    if (job) {
      job.status = 'failed';
      job.errorReason = body.reason || 'ส่งล้มเหลว / หาช่องพิมพ์ไม่เจอ';
      await this.campaignJobRepository.save(job);

      const campaign = await this.campaignRepository.findOne({ where: { id: job.campaignId } });
      if (campaign) {
        campaign.failedCount += 1;
        const remainingPending = await this.campaignJobRepository.count({
          where: [
            { campaignId: campaign.id, status: 'pending' },
            { campaignId: campaign.id, status: 'processing' },
          ],
        });

        if (remainingPending === 0) {
          campaign.status = 'completed';
          await this.campaignRepository.save(campaign);
          await this.checkAndSendTelegramReport(campaign);
        } else {
          await this.campaignRepository.save(campaign);
        }
      }

      // 🚫 ถ้าพบเหตุผลการบล็อก/ส่งไม่ได้ ให้ปิดสถานะผู้ใช้คนนี้ลงในตาราง customers ด้วย
      const isUserBlocked = body.isBlocked || (body.reason && (body.reason.includes('บล็อก') || body.reason.includes('ไม่สามารถส่งข้อความ')));
      if (isUserBlocked && job.lineUserId) {
        try {
          const customer = await this.customerRepository.findOne({ where: { lineUserId: job.lineUserId } });
          if (customer) {
            customer.isBlocked = true;
            customer.blockReason = body.reason || '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว';
            await this.customerRepository.save(customer);
            console.log(`🚫 ปิดสถานะผู้ใช้ในตาราง Customers เป็น "บล็อก/ส่งไม่ได้แล้ว": ${job.lineUserId}`);
          }
        } catch(e) {
          console.error(`⚠️ ไม่สามารถอัปเดตสถานะบล็อกให้ผู้ใช้ ${job.lineUserId}:`, e);
        }
      }

      console.log(`❌ ส่งข้อความล้มเหลว: ${job.lineUserId} (${body.reason})`);
    }

    return { success: true };
  }

  // API สำหรับสั่งหยุดแคมเปญทันทีเมื่อโควต้าเต็ม หรือพบ Error ติดต่อกันเกิน 10 ครั้ง (Circuit Breaker)
  @Post('campaign/stop')
  async stopCampaign(
    @Body() body: { campaignId?: string; jobId?: string; reason: string; limitReached?: boolean; errorOverflow?: boolean },
  ) {
    let campaignId = body.campaignId;

    if (!campaignId && body.jobId) {
      const job = await this.campaignJobRepository.findOne({ where: { id: body.jobId } });
      if (job) campaignId = job.campaignId;
    }

    if (campaignId) {
      const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
      if (campaign) {
        let stopStatus = 'stopped_user';
        if (body.limitReached) stopStatus = 'stopped_limit';
        else if (body.errorOverflow) stopStatus = 'stopped_error';

        campaign.status = stopStatus;
        await this.campaignRepository.save(campaign);

        // ปรับเปลี่ยนคิวที่เหลือทั้งหมดในแคมเปญนี้ให้เป็น failed พร้อมใส่เหตุผล
        const pendingJobs = await this.campaignJobRepository.find({
          where: [
            { campaignId: campaign.id, status: 'pending' },
            { campaignId: campaign.id, status: 'processing' },
          ],
        });

        for (const job of pendingJobs) {
          job.status = 'failed';
          job.errorReason = body.reason || 'ผู้ใช้สั่งหยุดการส่งแคมเปญ';
          await this.campaignJobRepository.save(job);
        }

        console.log(`🛑 สั่งหยุดแคมเปญ "${campaign.name}": สถานะ ${stopStatus} (เหตุผล: ${body.reason || 'ผู้ใช้สั่งหยุด'})`);
        await this.checkAndSendTelegramReport(campaign);
      }
    }

    return { success: true };
  }

  private async checkAndSendTelegramReport(campaign: Campaign) {
    try {
      const failedJobs = await this.campaignJobRepository.find({
        where: { campaignId: campaign.id, status: 'failed' },
      });

      const reasonCounts: Record<string, number> = {};
      failedJobs.forEach(j => {
        const r = j.errorReason || 'ไม่ทราบสาเหตุ';
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      });

      const topReasons = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => `${reason} (${count} ครั้ง)`);

      await this.telegramService.sendCampaignReport(campaign, topReasons);
    } catch (e) {
      console.error('⚠️ Failed to send Telegram report:', e);
    }
  }

  // API สำหรับการตั้งค่า Telegram (Telegram Settings APIs)
  @Get('telegram/settings')
  getTelegramSettings() {
    return this.telegramService.getSafeConfig();
  }

  @Post('telegram/settings')
  saveTelegramSettings(@Body() body: Partial<TelegramConfig>) {
    return this.telegramService.saveConfig(body);
  }

  @Post('telegram/test')
  async sendTelegramTest() {
    return await this.telegramService.sendTestMessage();
  }

  // API สำหรับสั่งหยุดแคมเปญชั่วคราว (Pause Campaign)
  @Post('campaign/pause')
  async pauseCampaign(@Body() body: { campaignId: string }) {
    if (!body.campaignId) return { success: false, message: 'กรุณาระบุ campaignId' };

    const campaign = await this.campaignRepository.findOne({ where: { id: body.campaignId } });
    if (campaign) {
      campaign.status = 'paused';
      await this.campaignRepository.save(campaign);
      console.log(`⏸️ สั่งหยุดแคมเปญชั่วคราว (Pause): "${campaign.name}"`);
      return { success: true, status: 'paused' };
    }
    return { success: false, message: 'ไม่พบแคมเปญที่ระบุ' };
  }

  // API สำหรับสั่งทำงานต่อ (Resume Campaign)
  @Post('campaign/resume')
  async resumeCampaign(@Body() body: { campaignId: string }) {
    if (!body.campaignId) return { success: false, message: 'กรุณาระบุ campaignId' };

    const campaign = await this.campaignRepository.findOne({ where: { id: body.campaignId } });
    if (campaign) {
      campaign.status = campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date() ? 'scheduled' : 'processing';
      await this.campaignRepository.save(campaign);
      console.log(`▶️ สั่งทำงานต่อ (Resume): "${campaign.name}" (สถานะ: ${campaign.status})`);
      return { success: true, status: campaign.status };
    }
    return { success: false, message: 'ไม่พบแคมเปญที่ระบุ' };
  }

  // ดึงรายการตารางตั้งเวลาส่งล่วงหน้าทั้งหมดพร้อมประวัติสถานะ (Scheduled Campaigns List with Execution History)
  @Get('campaigns/scheduled')
  async getScheduledCampaigns() {
    const campaigns = await this.campaignRepository.find({
      order: { scheduledAt: 'DESC' },
    });

    return campaigns.filter(c => c.scheduledAt !== null);
  }

  // ปรับเปลี่ยนวัน-เวลาส่งล่วงหน้า (Reschedule Campaign Time)
  @Post('campaign/reschedule')
  async rescheduleCampaign(
    @Body() body: { campaignId: string; scheduledAt: string },
  ) {
    if (!body.campaignId || !body.scheduledAt) {
      return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };
    }

    const campaign = await this.campaignRepository.findOne({ where: { id: body.campaignId } });
    if (!campaign) {
      return { success: false, message: 'ไม่พบแคมเปญที่ระบุ' };
    }

    const parsedDate = new Date(body.scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return { success: false, message: 'รูปแบบวันเวลาไม่ถูกต้อง' };
    }

    campaign.scheduledAt = parsedDate;
    if (campaign.status !== 'paused') {
      campaign.status = parsedDate > new Date() ? 'scheduled' : 'pending';
    }

    await this.campaignRepository.save(campaign);
    console.log(`⏰ อัปเดตเวลาส่งล่วงหน้าของแคมเปญ "${campaign.name}": ${parsedDate.toLocaleString('th-TH')}`);

    return {
      success: true,
      campaign,
      scheduledAt: parsedDate,
    };
  }

  // ==========================================
  // 4. รายงานเชิงลึก & ประวัติแคมเปญ (Analytics & History APIs)
  // ==========================================

  // ดึงข้อมูลรายงานสถิติเชิงลึกการส่ง (Deep Marketing & Delivery Analytics)
  @Get('analytics')
  async getAnalytics() {
    const totalCustomers = await this.customerRepository.count();
    const blockedCustomers = await this.customerRepository.count({ where: { isBlocked: true } });
    const activeCustomers = totalCustomers - blockedCustomers;

    const campaigns = await this.campaignRepository.find({ order: { createdAt: 'DESC' } });
    const totalCampaigns = campaigns.length;

    let totalSuccessSent = 0;
    let totalFailedSent = 0;
    let stoppedLimitCount = 0;
    let stoppedErrorCount = 0;
    let scheduledCount = 0;

    for (const c of campaigns) {
      totalSuccessSent += c.successCount || 0;
      totalFailedSent += c.failedCount || 0;
      if (c.status === 'stopped_limit') stoppedLimitCount++;
      if (c.status === 'stopped_error') stoppedErrorCount++;
      if (c.status === 'scheduled') scheduledCount++;
    }

    const totalTargetsSent = totalSuccessSent + totalFailedSent;
    const overallSuccessRate = totalTargetsSent > 0 
      ? Math.round((totalSuccessSent / totalTargetsSent) * 100) 
      : 100;

    // ดึงสถิติเหตุผลล้มเหลว 5 อันดับแรก
    const failedJobs = await this.campaignJobRepository.find({ where: { status: 'failed' } });
    const reasonMap = new Map<string, number>();

    for (const job of failedJobs) {
      const r = job.errorReason || 'ส่งล้มเหลวทั่วไป';
      let shortReason = r;
      if (r.includes('บล็อก') || r.includes('ไม่สามารถส่งข้อความ')) shortReason = '🚫 ผู้ใช้บล็อกแชท/ส่งไม่ได้แล้ว';
      else if (r.includes('โควต้า') || r.includes('limit') || r.includes('LIMIT')) shortReason = '🛑 ลิมิตโควต้า LINE OA เต็ม';
      else if (r.includes('Error') || r.includes('หาช่องพิมพ์')) shortReason = '🚨 Error ระบบ/หาช่องพิมพ์ไม่เจอ';

      reasonMap.set(shortReason, (reasonMap.get(shortReason) || 0) + 1);
    }

    const topReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      totalCampaigns,
      totalTargetsSent,
      totalSuccessSent,
      totalFailedSent,
      overallSuccessRate,
      stoppedLimitCount,
      stoppedErrorCount,
      scheduledCount,
      topReasons,
      recentCampaigns: campaigns.slice(0, 5),
    };
  }

  // ดึงรายการแคมเปญทั้งหมด (สำหรับ Dashboard History)
  @Get('campaigns')
  async getAllCampaigns() {
    return this.campaignRepository.find({ order: { createdAt: 'DESC' } });
  }

  // ดึงแม่แบบแคมเปญย้อนหลัง (สำหรับ Template Reuse Dropdown)
  @Get('campaigns/templates')
  async getCampaignTemplates() {
    return this.campaignRepository.find({
      order: { createdAt: 'DESC' },
      take: 15,
    });
  }

  // ดึงรายละเอียดแคมเปญและรายการคิวงานรายบุคคล
  @Get('campaigns/:id')
  async getCampaignDetail(@Param('id') id: string) {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('ไม่พบข้อมูลแคมเปญที่ระบุ');
    }

    const jobs = await this.campaignJobRepository.find({
      where: { campaignId: id },
      order: { createdAt: 'ASC' },
    });

    return {
      campaign,
      jobs,
    };
  }

  // 13. Endpoint สำหรับบันทึก Browser Diagnostic Safety Logs (BUG-WP001-UATLOG-R2)
  @Post('diagnostics/browser-event')
  async logBrowserEvent(@Body() body: any, @Req() req?: Request) {
    try {
      // 1. Direct socket peer address check (Do NOT trust x-forwarded-for header)
      const remoteAddress = (req?.socket?.remoteAddress || (req as any)?.connection?.remoteAddress || '').trim();
      const isLoopback = remoteAddress === '127.0.0.1' || 
                         remoteAddress === '::1' || 
                         remoteAddress === '::ffff:127.0.0.1';

      if (!isLoopback) {
        return { success: false, message: 'Forbidden: Local requests only' };
      }

      // 2. Strict event allowlist (Reject unapproved events without writing)
      const ALLOWED_EVENTS = new Set([
        'BOT_START',
        'JOB_RECEIVED',
        'NAVIGATE_TARGET',
        'PAGE_LOAD_ACTIVE_JOB',
        'RECIPIENT_VERIFY_OK',
        'RECIPIENT_VERIFY_FAIL',
        'NAVIGATION_404',
        'SEND_BLOCKED',
        'SAME_JOB_RECOVERY_START',
        'SAME_JOB_RETRY',
        'SAME_JOB_RETRY_EXHAUSTED',
        'TEXT_PRE_SEND_VERIFIED',
        'IMAGE_PRE_SEND_VERIFIED',
        'JOB_SUCCESS',
        'JOB_FAIL'
      ]);

      const sanitizeStr = (val: any, maxLen: number) => {
        if (val === undefined || val === null) return '';
        return String(val).trim().slice(0, maxLen);
      };

      const rawEvent = sanitizeStr(body?.event, 50);
      if (!ALLOWED_EVENTS.has(rawEvent)) {
        return { success: false, message: 'Invalid or unapproved event' };
      }

      const rawPath = sanitizeStr(body?.currentPath, 200);
      const cleanPath = rawPath.split('?')[0].split('#')[0];

      const parsedRetry = typeof body?.retryCount === 'number' 
        ? body.retryCount 
        : (parseInt(body?.retryCount, 10) || 0);
      const retryCount = Math.max(0, Math.min(100, isNaN(parsedRetry) ? 0 : parsedRetry));

      // 3. Strict allowlist fields ONLY (No arbitrary or forbidden fields like message, imageUrl, linkUrl)
      const allowed = {
        serverTimestamp: new Date().toISOString(),
        clientTimestamp: sanitizeStr(body?.clientTimestamp, 40) || new Date().toISOString(),
        event: rawEvent,
        scriptVersion: sanitizeStr(body?.scriptVersion, 20),
        tabSessionId: sanitizeStr(body?.tabSessionId, 50),
        jobId: sanitizeStr(body?.jobId, 100),
        expectedUserId: sanitizeStr(body?.expectedUserId, 100),
        botId: sanitizeStr(body?.botId, 100),
        currentPath: cleanPath,
        retryCount: retryCount,
        reason: sanitizeStr(body?.reason, 200),
      };

      const logDir = path.join(process.cwd(), 'uat-logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFilePath = path.join(logDir, 'browser-BUG-WP001-UAT.log');
      fs.appendFileSync(logFilePath, JSON.stringify(allowed) + '\n', 'utf8');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

