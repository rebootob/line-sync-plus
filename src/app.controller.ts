import { Controller, Get, Post, Delete, Body, Param, Query, NotFoundException, Res, Req, Headers, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, IsNull } from 'typeorm';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Customer } from './customer.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerGroupMember } from './entities/customer-group-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignJob } from './entities/campaign-job.entity';
import { OaRuntimeState } from './entities/oa-runtime-state.entity';
import { TelegramService, TelegramConfig } from './telegram.service';
import { RUNTIME_CONTRACT_VERSION, REQUIRED_WORKER_VERSION } from './runtime-version';

@Controller('api')
export class AppController {
  private static workerBotId: string | null = null;
  private static workerSeenAt: number | null = null;
  private static accountProtectionTelemetry: Record<string, {
    sendActions10m: number;
    sendActions1h: number;
    nextSendAt: number;
    errorCooldownUntil: number;
    workerSeenAt: number;
  }> = {};

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

    @InjectRepository(OaRuntimeState)
    private oaRuntimeStateRepository: Repository<OaRuntimeState>,

    private telegramService: TelegramService,
  ) {}

  private updateWorkerObservationalState(headerBotId?: string) {
    if (headerBotId && /^U[0-9a-fA-F]{32}$/.test(headerBotId.trim())) {
      AppController.workerBotId = headerBotId.trim();
      AppController.workerSeenAt = Date.now();
    }
  }

  // 🛡️ OA-WP001 OA CONTEXT DISCOVERY & MANAGEMENT ENDPOINTS
  @Get('oa/contexts')
  async getOaContexts() {
    const raw = await this.customerRepository
      .createQueryBuilder('c')
      .select('c.botId', 'botId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN c.isBlocked = false THEN 1 ELSE 0 END)', 'active')
      .addSelect('SUM(CASE WHEN c.isBlocked = true THEN 1 ELSE 0 END)', 'blocked')
      .where('c.botId IS NOT NULL')
      .groupBy('c.botId')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    return raw.map(row => ({
      botId: row.botId,
      total: parseInt(row.total, 10) || 0,
      active: parseInt(row.active, 10) || 0,
      blocked: parseInt(row.blocked, 10) || 0,
    }));
  }

  @Get('oa/active')
  async getActiveOa(@Headers('x-linesync-oa-context') workerOaHeader?: string) {
    this.updateWorkerObservationalState(workerOaHeader);
    const state = await this.oaRuntimeStateRepository.findOne({ where: { id: 'global' } });
    const activeBotId = state ? state.activeBotId : null;
    const workerBotId = AppController.workerBotId;
    const workerSeenAt = AppController.workerSeenAt;
    const aligned = !!(activeBotId && workerBotId && activeBotId === workerBotId);

    return {
      activeBotId,
      workerBotId,
      workerSeenAt,
      aligned,
    };
  }

  @Post('oa/active')
  async setActiveOa(
    @Body() body: { botId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body || !body.botId || !/^U[0-9a-fA-F]{32}$/.test(body.botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Invalid botId format' };
    }

    const requestedBotId = body.botId.trim();

    // 1. Verify existence in customers table
    const existingCustomer = await this.customerRepository.findOne({ where: { botId: requestedBotId } });
    if (!existingCustomer) {
      res.status(HttpStatus.NOT_FOUND);
      return { success: false, message: 'Requested OA botId does not exist in customers table' };
    }

    // 2. Verify Master Bot is PAUSED
    if (AppController.isBotEnabled) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: 'Master Bot must be paused before switching OA context' };
    }

    // 3. Verify no currently processing job
    const processingJobCount = await this.campaignJobRepository.count({ where: { status: 'processing' } });
    if (processingJobCount > 0) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: 'Cannot switch OA while a campaign job is currently processing' };
    }

    // 4. Persist in oa_runtime_state
    let state = await this.oaRuntimeStateRepository.findOne({ where: { id: 'global' } });
    if (!state) {
      state = this.oaRuntimeStateRepository.create({ id: 'global', activeBotId: requestedBotId });
    } else {
      state.activeBotId = requestedBotId;
    }
    await this.oaRuntimeStateRepository.save(state);

    console.log(`🌐 activeBotId switched to: ${requestedBotId}`);
    return { success: true, activeBotId: requestedBotId };
  }

  // 1. ดึงรายชื่อลูกค้าตาม botId ที่ระบุเท่านั้น (OA-WP001 Isolation)
  @Get('customers')
  async getAllCustomers(
    @Query('botId') botId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!botId || !/^U[0-9a-fA-F]{32}$/.test(botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId query parameter' };
    }

    const cleanBotId = botId.trim();
    const customers = await this.customerRepository.find({
      where: { botId: cleanBotId },
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

  // SYNC-WP001 — LINE OA Customer Directory Sync to DB
  @Post('customers/sync-batch')
  async syncCustomerBatch(
    @Body() body: { botId?: string; records?: { lineUserId?: string; displayName?: string }[] },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.socket?.remoteAddress || '';
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    if (!isLoopback) {
      res.status(HttpStatus.FORBIDDEN);
      return { success: false, message: 'Forbidden: Request must originate from local loopback' };
    }

    if (!body || !body.botId || !/^U[0-9a-fA-F]{32}$/.test(body.botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId parameter' };
    }
    const cleanBotId = body.botId.trim();

    const state = await this.oaRuntimeStateRepository.findOne({ where: { id: 'global' } });
    const activeBotId = state ? state.activeBotId : null;
    if (!activeBotId || cleanBotId !== activeBotId) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: `Requested botId (${cleanBotId}) does not match active OA (${activeBotId})` };
    }

    if (AppController.isBotEnabled) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: 'Master Bot must be paused before running customer synchronization' };
    }

    if (!body.records || !Array.isArray(body.records)) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing records array parameter' };
    }

    if (body.records.length > 250) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Batch size exceeds maximum limit of 250' };
    }

    const receivedCount = body.records.length;
    let invalidCount = 0;
    let duplicateInBatchCount = 0;

    const validMap = new Map<string, string>();
    for (const rec of body.records) {
      if (!rec || !rec.lineUserId || typeof rec.lineUserId !== 'string' || !/^U[0-9a-fA-F]{32}$/.test(rec.lineUserId.trim())) {
        invalidCount++;
        continue;
      }
      const uid = rec.lineUserId.trim();
      const name = (rec.displayName && typeof rec.displayName === 'string') ? rec.displayName.trim() : 'ลูกค้า';
      if (validMap.has(uid)) {
        duplicateInBatchCount++;
      } else {
        validMap.set(uid, name);
      }
    }

    const uniqueLineUserIds = Array.from(validMap.keys());
    if (uniqueLineUserIds.length === 0) {
      return {
        success: true,
        received: receivedCount,
        inserted: 0,
        updatedName: 0,
        existingUnchanged: 0,
        duplicateInBatch: duplicateInBatchCount,
        invalid: invalidCount,
      };
    }

    const existingCustomers = await this.customerRepository.find({
      where: {
        botId: cleanBotId,
        lineUserId: In(uniqueLineUserIds),
      },
    });

    const existingMap = new Map<string, Customer>();
    for (const cust of existingCustomers) {
      existingMap.set(cust.lineUserId, cust);
    }

    const toInsert: Customer[] = [];
    const toUpdate: Customer[] = [];
    let unchangedCount = 0;

    for (const [uid, name] of validMap.entries()) {
      const existing = existingMap.get(uid);
      if (existing) {
        if (existing.displayName !== name) {
          existing.displayName = name;
          toUpdate.push(existing);
        } else {
          unchangedCount++;
        }
      } else {
        const newCust = this.customerRepository.create({
          botId: cleanBotId,
          lineUserId: uid,
          displayName: name,
          isBlocked: false,
        }) as unknown as Customer;
        toInsert.push(newCust);
      }
    }

    if (toInsert.length > 0) {
      await this.customerRepository.save(toInsert);
    }

    if (toUpdate.length > 0) {
      await this.customerRepository.save(toUpdate);
    }

    return {
      success: true,
      received: receivedCount,
      inserted: toInsert.length,
      updatedName: toUpdate.length,
      existingUnchanged: unchangedCount,
      duplicateInBatch: duplicateInBatchCount,
      invalid: invalidCount,
    };
  }

  // 1.1 อัปโหลดรูปภาพจากเครื่องคอมพิวเตอร์ Local บันทึกลงเซิร์ฟเวอร์
  @Post('upload/image')
  async uploadImage(@Body() body: { base64: string; filename?: string }) {
    if (!body.base64) {
      return { success: false, message: 'ไม่มีข้อมูลรูปภาพ' };
    }

    try {
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

      console.log(`🖼️ อัปโหลดรูปภาพสำเร็จ: ${fileUrl}`);

      return {
        success: true,
        url: fileUrl,
        filename: savedFilename,
      };
    } catch (e) {
      console.error('❌ ไม่สามารถอัปโหลดรูปภาพได้:', e);
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกรูปภาพบนเซิร์ฟเวอร์' };
    }
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

  // ดึงรายการกลุ่มตาม botId ที่ระบุเท่านั้น (OA-WP001 Isolation)
  @Get('groups')
  async getAllGroups(
    @Query('botId') botId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!botId || !/^U[0-9a-fA-F]{32}$/.test(botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId query parameter' };
    }

    const cleanBotId = botId.trim();
    const groups = await this.groupRepository.find({
      where: { botId: cleanBotId },
      order: { createdAt: 'DESC' },
    });

    const result = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.groupMemberRepository.count({
          where: { groupId: group.id, botId: cleanBotId },
        });
        return {
          ...group,
          memberCount,
        };
      }),
    );

    return result;
  }

  // ดึงรายชื่อสมาชิกในกลุ่มเฉพาะ ID (OA-WP001 Scoped)
  @Get('groups/:id')
  async getGroupDetail(
    @Param('id') id: string,
    @Query('botId') botId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!botId || !/^U[0-9a-fA-F]{32}$/.test(botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId query parameter' };
    }

    const cleanBotId = botId.trim();
    const group = await this.groupRepository.findOne({ where: { id, botId: cleanBotId } });
    if (!group) {
      res.status(HttpStatus.NOT_FOUND);
      return { success: false, message: 'ไม่พบกลุ่มลูกค้าที่ระบุ' };
    }

    const members = await this.groupMemberRepository.find({
      where: { groupId: id, botId: cleanBotId },
    });

    return {
      group,
      targetIds: members.map(m => m.lineUserId),
    };
  }

  // สร้างกลุ่มใหม่พร้อมรายชื่อสมาชิก (OA-WP001 Member Verification)
  @Post('groups')
  async createGroup(
    @Body() body: { botId: string; name: string; description?: string; targetIds: string[] },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body || !body.botId || !/^U[0-9a-fA-F]{32}$/.test(body.botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId parameter' };
    }

    const cleanBotId = body.botId.trim();

    if (!body.name || !body.targetIds || body.targetIds.length === 0) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'กรุณาระบุชื่อกลุ่มและเลือกสมาชิกอย่างน้อย 1 คน' };
    }

    // Verify EVERY targetId belongs to cleanBotId in customers table
    for (const userId of body.targetIds) {
      const customer = await this.customerRepository.findOne({ where: { botId: cleanBotId, lineUserId: userId } });
      if (!customer) {
        res.status(HttpStatus.BAD_REQUEST);
        return { success: false, message: `Target ID ${userId} does not belong to OA ${cleanBotId}` };
      }
    }

    const group = this.groupRepository.create({
      botId: cleanBotId,
      name: body.name.trim(),
      description: body.description ? body.description.trim() : null,
    });
    const savedGroup = await this.groupRepository.save(group);

    const members = body.targetIds.map(userId =>
      this.groupMemberRepository.create({
        botId: cleanBotId,
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

  // ลบกลุ่มลูกค้า (OA-WP001 Scoped)
  @Delete('groups/:id')
  async deleteGroup(
    @Param('id') id: string,
    @Query('botId') botId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!botId || !/^U[0-9a-fA-F]{32}$/.test(botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId query parameter' };
    }

    const cleanBotId = botId.trim();
    const group = await this.groupRepository.findOne({ where: { id, botId: cleanBotId } });
    if (!group) {
      res.status(HttpStatus.NOT_FOUND);
      return { success: false, message: 'ไม่พบกลุ่มลูกค้าที่ระบุ' };
    }

    await this.groupMemberRepository.delete({ groupId: id, botId: cleanBotId });
    await this.groupRepository.delete({ id, botId: cleanBotId });

    return { success: true };
  }

  // 🛡️ SAFE-WP001-R2 ACCOUNT PROTECTION TELEMETRY ENDPOINTS
  @Post('account-protection/telemetry')
  async recordAccountProtectionTelemetry(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Headers('x-linesync-oa-context') oaContext: string | undefined,
    @Req() req: Request,
    @Body()
    body: {
      botId: string;
      sendActions10m?: number;
      sendActions1h?: number;
      nextSendAt?: number;
      errorCooldownUntil?: number;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const remoteAddress = (req?.socket?.remoteAddress || (req as any)?.connection?.remoteAddress || '').trim();
    const isLoopback = remoteAddress === '127.0.0.1' ||
                       remoteAddress === '::1' ||
                       remoteAddress === '::ffff:127.0.0.1';

    if (!isLoopback) {
      res.status(HttpStatus.FORBIDDEN);
      return { success: false, message: 'Forbidden: Loopback requests only' };
    }

    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      res.status(HttpStatus.CONFLICT);
      return {
        success: false,
        status: 'version_mismatch',
        requiredWorkerVersion: REQUIRED_WORKER_VERSION,
      };
    }

    if (!oaContext || !/^U[0-9a-fA-F]{32}$/.test(oaContext.trim())) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: 'X-LineSync-OA-Context header missing or invalid' };
    }

    if (!body || !body.botId || !/^U[0-9a-fA-F]{32}$/.test(body.botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId parameter' };
    }

    const cleanBotId = body.botId.trim();
    if (oaContext.trim() !== cleanBotId) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: 'OA context mismatch between header and body' };
    }

    const { sendActions10m, sendActions1h, nextSendAt, errorCooldownUntil } = body;

    if (
      typeof sendActions10m !== 'number' || !Number.isInteger(sendActions10m) || sendActions10m < 0 ||
      typeof sendActions1h !== 'number' || !Number.isInteger(sendActions1h) || sendActions1h < 0 ||
      typeof nextSendAt !== 'number' || !Number.isFinite(nextSendAt) || nextSendAt < 0 ||
      typeof errorCooldownUntil !== 'number' || !Number.isFinite(errorCooldownUntil) || errorCooldownUntil < 0
    ) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Invalid telemetry parameter values' };
    }

    AppController.accountProtectionTelemetry[cleanBotId] = {
      sendActions10m,
      sendActions1h,
      nextSendAt,
      errorCooldownUntil,
      workerSeenAt: Date.now(),
    };

    return { success: true };
  }

  @Get('account-protection/status')
  async getAccountProtectionStatus(
    @Query('botId') botId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!botId || !/^U[0-9a-fA-F]{32}$/.test(botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, available: false, message: 'Missing or invalid botId query parameter' };
    }

    const cleanBotId = botId.trim();
    const data = AppController.accountProtectionTelemetry[cleanBotId];

    if (!data || (Date.now() - data.workerSeenAt > 30000)) {
      return {
        success: true,
        available: false,
        botId: cleanBotId,
        message: 'Account Protection telemetry unavailable or stale',
      };
    }

    return {
      success: true,
      available: true,
      botId: cleanBotId,
      sendActions10m: data.sendActions10m,
      sendActions1h: data.sendActions1h,
      nextSendAt: data.nextSendAt,
      errorCooldownUntil: data.errorCooldownUntil,
      workerSeenAt: data.workerSeenAt,
    };
  }

  // ==========================================
  // 3. ระบบจัดการแคมเปญส่งข้อความ (Campaign & DB Queue APIs)
  // ==========================================

  // สร้างแคมเปญและสร้างคิวงานในฐานข้อมูล (รองรับ Scheduled Time & Multi-type & OA Ownership)
  @Post('campaign/add')
  async addCampaign(
    @Body()
    body: {
      botId: string;
      name?: string;
      messageType?: string;
      message: string;
      imageUrl?: string;
      linkUrl?: string;
      targetIds: string[];
      scheduledAt?: string; // ISO string date-time
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body || !body.botId || !/^U[0-9a-fA-F]{32}$/.test(body.botId.trim())) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing or invalid botId parameter' };
    }

    const cleanBotId = body.botId.trim();

    // Verify botId equals activeBotId in oa_runtime_state
    const state = await this.oaRuntimeStateRepository.findOne({ where: { id: 'global' } });
    if (!state || !state.activeBotId || state.activeBotId !== cleanBotId) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, message: `Requested botId ${cleanBotId} does not match active OA context` };
    }

    if (!body.targetIds || body.targetIds.length === 0) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'ไม่มีรายชื่อเป้าหมาย' };
    }

    const requestedCount = body.targetIds.length;
    const uniqueTargetIds = Array.from(new Set(body.targetIds));
    const excludedDuplicateCount = requestedCount - uniqueTargetIds.length;

    let excludedBlockedCount = 0;
    const validTargetIds: string[] = [];

    // Verify every targetId belongs to cleanBotId in customers and exclude blocked customers
    for (const userId of uniqueTargetIds) {
      const customer = await this.customerRepository.findOne({ where: { botId: cleanBotId, lineUserId: userId } });
      if (!customer) {
        res.status(HttpStatus.BAD_REQUEST);
        return { success: false, message: `Target ID ${userId} does not belong to OA ${cleanBotId}` };
      }
      if (customer.isBlocked === true) {
        excludedBlockedCount++;
      } else {
        validTargetIds.push(userId);
      }
    }

    if (validTargetIds.length === 0) {
      res.status(HttpStatus.BAD_REQUEST);
      return {
        success: false,
        message: 'ไม่พบผู้รับที่สามารถส่งได้ (ผู้รับทั้งหมดถูกบล็อกหรือซ้ำ)',
        requestedCount,
        queuedCount: 0,
        excludedDuplicateCount,
        excludedBlockedCount,
      };
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

    // สร้าง Record แคมเปญใน DB พร้อม botId
    const campaign = this.campaignRepository.create({
      botId: cleanBotId,
      name: campaignName,
      messageType: messageType,
      message: body.message,
      imageUrl: body.imageUrl || null,
      linkUrl: body.linkUrl || null,
      totalTargets: validTargetIds.length,
      successCount: 0,
      failedCount: 0,
      status: initialStatus,
      scheduledAt: scheduledDate,
    });
    const savedCampaign = await this.campaignRepository.save(campaign);

    // สร้าง Record คิวงานรายบุคคลใน DB พร้อม botId
    const jobs = validTargetIds.map(userId =>
      this.campaignJobRepository.create({
        botId: cleanBotId,
        campaignId: savedCampaign.id,
        lineUserId: userId,
        status: 'pending',
      }),
    );
    await this.campaignJobRepository.save(jobs);

    console.log(`📥 บันทึกแคมเปญลง DB เรียบร้อย: "${savedCampaign.name}" (${jobs.length} รายการ, สถานะ: ${initialStatus}, OA: ${cleanBotId})`);

    return {
      success: true,
      campaignId: savedCampaign.id,
      requestedCount,
      queuedCount: jobs.length,
      excludedDuplicateCount,
      excludedBlockedCount,
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

  private isValidWorkerInstance(instance: string | undefined): boolean {
    if (!instance || typeof instance !== 'string') return false;
    const trimmed = instance.trim();
    return /^ts_[0-9]{10,17}_[a-z0-9]{4,32}$/.test(trimmed);
  }

  // API สำหรับ Tampermonkey มาขอรับคิวงานถัดไปจาก DB (พร้อมระบบ Scheduled, OA Gate & Stale Worker Fencing REL-WP002)
  @Get('campaign/next')
  async getNextJob(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Headers('x-linesync-oa-context') workerOaHeader: string | undefined,
    @Headers('x-linesync-worker-instance') workerInstance: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    // A. Version validation
    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'version_mismatch',
        requiredWorkerVersion: REQUIRED_WORKER_VERSION,
      };
    }

    // B. OA Header validation
    if (!workerOaHeader || !/^U[0-9a-fA-F]{32}$/.test(workerOaHeader.trim())) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'missing_oa_context',
        message: 'X-LineSync-OA-Context header missing or invalid',
      };
    }

    // C. Worker Instance validation
    if (!this.isValidWorkerInstance(workerInstance)) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'missing_worker_instance',
        message: 'X-LineSync-Worker-Instance header missing or invalid',
      };
    }

    const workerBotId = workerOaHeader.trim();
    const cleanWorkerInstance = workerInstance!.trim();
    this.updateWorkerObservationalState(workerBotId);

    // D. Persisted Active OA validation
    const state = await this.oaRuntimeStateRepository.findOne({ where: { id: 'global' } });
    const activeBotId = state ? state.activeBotId : null;

    if (!activeBotId) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'oa_not_selected',
        message: 'No active LINE OA selected in system',
      };
    }

    // E. Worker OA == Active OA validation
    if (workerBotId !== activeBotId) {
      res.status(HttpStatus.CONFLICT);
      return {
        status: 'oa_context_mismatch',
        activeBotId,
        message: `Worker OA (${workerBotId}) does not match active OA (${activeBotId})`,
      };
    }

    // F. Master Bot enabled validation
    if (!AppController.isBotEnabled) {
      return { status: 'empty', reason: 'Master Bot is Paused' };
    }

    // G. Query candidate jobs (pending OR expired processing)
    const now = new Date();
    const nowMs = now.getTime();
    const staleFallbackTime = new Date(nowMs - 60000); // 60s fallback for legacy NULL lease

    const pendingJobs = await this.campaignJobRepository.find({
      where: { status: 'pending', botId: activeBotId },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    const expiredProcessingJobs = await this.campaignJobRepository.find({
      where: [
        { status: 'processing', botId: activeBotId, leaseExpiresAt: LessThan(now) },
        { status: 'processing', botId: activeBotId, leaseExpiresAt: IsNull(), updatedAt: LessThan(staleFallbackTime) },
      ],
      order: { updatedAt: 'ASC' },
      take: 50,
    });

    const candidateJobs = [...pendingJobs, ...expiredProcessingJobs];
    const readyCandidates: { job: CampaignJob; campaign: Campaign }[] = [];

    for (const j of candidateJobs) {
      if (!j.botId || j.botId !== activeBotId) continue;
      const camp = await this.campaignRepository.findOne({ where: { id: j.campaignId, botId: activeBotId } });
      if (!camp || !camp.botId || camp.botId !== activeBotId) continue;

      if (['stopped_limit', 'stopped_error', 'stopped_user', 'paused', 'failed', 'completed'].includes(camp.status)) continue;
      if (camp.scheduledAt && new Date(camp.scheduledAt).getTime() > nowMs) continue;

      readyCandidates.push({ job: j, campaign: camp });
    }

    readyCandidates.sort((a, b) => {
      const timeA = a.campaign.scheduledAt ? new Date(a.campaign.scheduledAt).getTime() : new Date(a.campaign.createdAt).getTime();
      const timeB = b.campaign.scheduledAt ? new Date(b.campaign.scheduledAt).getTime() : new Date(b.campaign.createdAt).getTime();
      return timeA - timeB;
    });

    for (const candidate of readyCandidates) {
      const selectedJob = candidate.job;
      const targetCampaign = candidate.campaign;

      const newLeaseToken = randomUUID();
      const leaseExpiresAt = new Date(nowMs + 60000);

      // Atomic conditional update
      const updateResult = await this.campaignJobRepository
        .createQueryBuilder()
        .update(CampaignJob)
        .set({
          status: 'processing',
          leaseToken: newLeaseToken,
          leaseOwner: cleanWorkerInstance,
          leaseHeartbeatAt: now,
          leaseExpiresAt: leaseExpiresAt,
        })
        .where('id = :id', { id: selectedJob.id })
        .andWhere(
          '(status = :pendingStatus OR (status = :procStatus AND "leaseExpiresAt" IS NOT NULL AND "leaseExpiresAt" <= :nowTime) OR (status = :procStatus AND "leaseExpiresAt" IS NULL AND "updatedAt" <= :staleFallbackTime))',
          {
            pendingStatus: 'pending',
            procStatus: 'processing',
            nowTime: now,
            staleFallbackTime: staleFallbackTime,
          },
        )
        .execute();

      if (updateResult.affected && updateResult.affected > 0) {
        if (!targetCampaign.startedAt) {
          targetCampaign.startedAt = now;
        }
        if (['scheduled', 'pending'].includes(targetCampaign.status)) {
          targetCampaign.status = 'processing';
        }
        await this.campaignRepository.save(targetCampaign);

        return {
          jobId: selectedJob.id,
          campaignId: selectedJob.campaignId,
          botId: selectedJob.botId,
          userId: selectedJob.lineUserId,
          messageType: targetCampaign.messageType || 'text',
          message: targetCampaign.message || '',
          imageUrl: targetCampaign.imageUrl || null,
          linkUrl: targetCampaign.linkUrl || null,
          status: 'processing',
          leaseToken: newLeaseToken,
          leaseExpiresAt: leaseExpiresAt.getTime(),
        };
      }
    }

    return { status: 'empty' };
  }

  // API สำหรับส่ง Heartbeat ต่ออายุ Job Lease (REL-WP002)
  @Post('campaign/heartbeat')
  async heartbeatJobLease(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Headers('x-linesync-oa-context') workerOaHeader: string | undefined,
    @Headers('x-linesync-worker-instance') workerInstance: string | undefined,
    @Body() body: { jobId?: string; botId?: string; leaseToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'version_mismatch', requiredWorkerVersion: REQUIRED_WORKER_VERSION };
    }

    if (!workerOaHeader || !/^U[0-9a-fA-F]{32}$/.test(workerOaHeader.trim())) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_oa_context', message: 'X-LineSync-OA-Context header missing or invalid' };
    }

    if (!this.isValidWorkerInstance(workerInstance)) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_worker_instance', message: 'X-LineSync-Worker-Instance header missing or invalid' };
    }

    if (!body || !body.jobId || !body.botId || !body.leaseToken) {
      res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing required heartbeat parameters' };
    }

    const cleanWorkerBotId = workerOaHeader.trim();
    const cleanBodyBotId = body.botId.trim();
    const cleanWorkerInstance = workerInstance!.trim();

    if (cleanWorkerBotId !== cleanBodyBotId) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'oa_context_mismatch', message: 'OA context mismatch between header and body' };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const newExpiresAt = new Date(nowMs + 60000);

    const result = await this.campaignJobRepository
      .createQueryBuilder()
      .update(CampaignJob)
      .set({
        leaseHeartbeatAt: now,
        leaseExpiresAt: newExpiresAt,
      })
      .where('id = :jobId', { jobId: body.jobId })
      .andWhere('botId = :botId', { botId: cleanBodyBotId })
      .andWhere('status = :status', { status: 'processing' })
      .andWhere('"leaseToken" = :leaseToken', { leaseToken: body.leaseToken })
      .andWhere('"leaseOwner" = :leaseOwner', { leaseOwner: cleanWorkerInstance })
      .andWhere('"leaseExpiresAt" IS NOT NULL AND "leaseExpiresAt" > :now', { now })
      .execute();

    if (!result.affected || result.affected === 0) {
      res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'lease_lost', message: 'Job lease is invalid or expired' };
    }

    return { success: true, leaseExpiresAt: newExpiresAt.getTime() };
  }

  // API สำหรับ Tampermonkey มารายงานว่าส่งเสร็จแล้ว (พร้อมระบบ Transactional Fenced Lease Validation)
  @Post('campaign/success')
  async markSuccess(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Headers('x-linesync-oa-context') workerOaHeader: string | undefined,
    @Headers('x-linesync-worker-instance') workerInstance: string | undefined,
    @Body() body: { jobId?: string; botId?: string; leaseToken?: string },
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'version_mismatch' };
    }

    if (!workerOaHeader || !/^U[0-9a-fA-F]{32}$/.test(workerOaHeader.trim())) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_oa_context' };
    }

    if (!this.isValidWorkerInstance(workerInstance)) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_worker_instance' };
    }

    if (!body || !body.jobId || !body.botId || !body.leaseToken) {
      if (res) res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing required parameters (jobId, botId, leaseToken required)' };
    }

    const cleanWorkerBotId = workerOaHeader.trim();
    const cleanBodyBotId = body.botId.trim();
    const cleanWorkerInstance = workerInstance!.trim();

    if (cleanWorkerBotId !== cleanBodyBotId) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'oa_context_mismatch' };
    }

    return await this.campaignJobRepository.manager.transaction(async (manager) => {
      const jobRepo = manager.getRepository(CampaignJob);
      const campRepo = manager.getRepository(Campaign);

      const now = new Date();

      const updateResult = await jobRepo
        .createQueryBuilder()
        .update(CampaignJob)
        .set({
          status: 'success',
          sentAt: now,
          leaseToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          leaseHeartbeatAt: null,
        })
        .where('id = :jobId', { jobId: body.jobId })
        .andWhere('botId = :botId', { botId: cleanBodyBotId })
        .andWhere('status = :procStatus', { procStatus: 'processing' })
        .andWhere('"leaseToken" = :leaseToken', { leaseToken: body.leaseToken })
        .andWhere('"leaseOwner" = :leaseOwner', { leaseOwner: cleanWorkerInstance })
        .andWhere('"leaseExpiresAt" IS NOT NULL AND "leaseExpiresAt" > :now', { now })
        .execute();

      if (!updateResult.affected || updateResult.affected === 0) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'lease_lost', message: 'Job lease is invalid, stale, or already finalized' };
      }

      const job = await jobRepo.findOne({ where: { id: body.jobId } });
      if (job) {
        const campaign = await campRepo.findOne({ where: { id: job.campaignId } });
        if (campaign) {
          campaign.successCount += 1;
          const remainingPending = await jobRepo.count({
            where: [
              { campaignId: campaign.id, status: 'pending' },
              { campaignId: campaign.id, status: 'processing' },
            ],
          });

          if (remainingPending === 0) {
            campaign.status = 'completed';
          }
          await campRepo.save(campaign);
          if (remainingPending === 0) {
            this.checkAndSendTelegramReport(campaign).catch(() => {});
          }
        }
        console.log(`✅ ส่งข้อความสำเร็จ: ${job.lineUserId}`);
      }

      return { success: true };
    });
  }

  // API สำหรับ Tampermonkey มารายงานว่าส่งล้มเหลว (พร้อมระบบ Transactional Fenced Lease Validation)
  @Post('campaign/fail')
  async markFail(
    @Headers('x-linesync-worker-version') workerVersion: string | undefined,
    @Headers('x-linesync-oa-context') workerOaHeader: string | undefined,
    @Headers('x-linesync-worker-instance') workerInstance: string | undefined,
    @Body() body: { jobId?: string; botId?: string; leaseToken?: string; reason?: string; isBlocked?: boolean },
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'version_mismatch' };
    }

    if (!workerOaHeader || !/^U[0-9a-fA-F]{32}$/.test(workerOaHeader.trim())) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_oa_context' };
    }

    if (!this.isValidWorkerInstance(workerInstance)) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'missing_worker_instance' };
    }

    if (!body || !body.jobId || !body.botId || !body.leaseToken) {
      if (res) res.status(HttpStatus.BAD_REQUEST);
      return { success: false, message: 'Missing required parameters (jobId, botId, leaseToken required)' };
    }

    const cleanWorkerBotId = workerOaHeader.trim();
    const cleanBodyBotId = body.botId.trim();
    const cleanWorkerInstance = workerInstance!.trim();

    if (cleanWorkerBotId !== cleanBodyBotId) {
      if (res) res.status(HttpStatus.CONFLICT);
      return { success: false, status: 'oa_context_mismatch' };
    }

    return await this.campaignJobRepository.manager.transaction(async (manager) => {
      const jobRepo = manager.getRepository(CampaignJob);
      const campRepo = manager.getRepository(Campaign);
      const custRepo = manager.getRepository(Customer);

      const now = new Date();

      const updateResult = await jobRepo
        .createQueryBuilder()
        .update(CampaignJob)
        .set({
          status: 'failed',
          errorReason: body.reason || 'ส่งล้มเหลว / หาช่องพิมพ์ไม่เจอ',
          leaseToken: null,
          leaseOwner: null,
          leaseExpiresAt: null,
          leaseHeartbeatAt: null,
        })
        .where('id = :jobId', { jobId: body.jobId })
        .andWhere('botId = :botId', { botId: cleanBodyBotId })
        .andWhere('status = :procStatus', { procStatus: 'processing' })
        .andWhere('"leaseToken" = :leaseToken', { leaseToken: body.leaseToken })
        .andWhere('"leaseOwner" = :leaseOwner', { leaseOwner: cleanWorkerInstance })
        .andWhere('"leaseExpiresAt" IS NOT NULL AND "leaseExpiresAt" > :now', { now })
        .execute();

      if (!updateResult.affected || updateResult.affected === 0) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'lease_lost', message: 'Job lease is invalid, stale, or already finalized' };
      }

      const job = await jobRepo.findOne({ where: { id: body.jobId } });
      if (job) {
        const campaign = await campRepo.findOne({ where: { id: job.campaignId } });
        if (campaign) {
          campaign.failedCount += 1;
          const remainingPending = await jobRepo.count({
            where: [
              { campaignId: campaign.id, status: 'pending' },
              { campaignId: campaign.id, status: 'processing' },
            ],
          });

          if (remainingPending === 0) {
            campaign.status = 'completed';
          }
          await campRepo.save(campaign);
          if (remainingPending === 0) {
            this.checkAndSendTelegramReport(campaign).catch(() => {});
          }
        }

        const isUserBlocked = body.isBlocked || (body.reason && (body.reason.includes('บล็อก') || body.reason.includes('ไม่สามารถส่งข้อความ')));
        if (isUserBlocked && job.lineUserId && job.botId && /^U[0-9a-fA-F]{32}$/.test(job.botId)) {
          try {
            const customer = await custRepo.findOne({ where: { botId: job.botId, lineUserId: job.lineUserId } });
            if (customer) {
              customer.isBlocked = true;
              customer.blockReason = body.reason || '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว';
              await custRepo.save(customer);
              console.log(`🚫 ปิดสถานะผู้ใช้ในตาราง Customers เป็น "บล็อก/ส่งไม่ได้แล้ว": ${job.lineUserId} (OA: ${job.botId})`);
            }
          } catch(e) {
            console.error(`⚠️ ไม่สามารถอัปเดตสถานะบล็อกให้ผู้ใช้ ${job.lineUserId}:`, e);
          }
        }

        console.log(`❌ ส่งข้อความล้มเหลว: ${job.lineUserId} (${body.reason})`);
      }

      return { success: true };
    });
  }

  // API สำหรับสั่งหยุดแคมเปญทันทีเมื่อโควต้าเต็ม หรือพบ Error ติดต่อกันเกิน 10 ครั้ง (Circuit Breaker พร้อม Fenced Stop Authority)
  @Post('campaign/stop')
  async stopCampaign(
    @Headers('x-linesync-worker-version') workerVersion?: string,
    @Headers('x-linesync-oa-context') workerOaHeader?: string,
    @Headers('x-linesync-worker-instance') workerInstance?: string,
    @Body() body?: { campaignId?: string; jobId?: string; botId?: string; leaseToken?: string; reason?: string; limitReached?: boolean; errorOverflow?: boolean },
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (body?.jobId) {
      if (!workerVersion || workerVersion.trim() !== REQUIRED_WORKER_VERSION) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'version_mismatch', requiredWorkerVersion: REQUIRED_WORKER_VERSION };
      }

      if (!workerOaHeader || !/^U[0-9a-fA-F]{32}$/.test(workerOaHeader.trim())) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'missing_oa_context' };
      }

      if (!body.botId || workerOaHeader.trim() !== body.botId.trim()) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'oa_context_mismatch' };
      }

      if (!this.isValidWorkerInstance(workerInstance)) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'missing_worker_instance' };
      }

      if (!body.leaseToken) {
        if (res) res.status(HttpStatus.CONFLICT);
        return { success: false, status: 'lease_lost', message: 'Worker-driven stop requires valid active job lease' };
      }
    }

    return await this.campaignJobRepository.manager.transaction(async (manager) => {
      const jobRepo = manager.getRepository(CampaignJob);
      const campRepo = manager.getRepository(Campaign);
      const now = new Date();

      let targetCampaignId = body?.campaignId;

      if (body?.jobId) {
        const callingJob = await jobRepo
          .createQueryBuilder('job')
          .where('job.id = :jobId', { jobId: body.jobId })
          .andWhere('job.botId = :botId', { botId: body.botId!.trim() })
          .andWhere('job.status = :status', { status: 'processing' })
          .andWhere('job.leaseToken = :leaseToken', { leaseToken: body.leaseToken })
          .andWhere('job.leaseOwner = :leaseOwner', { leaseOwner: workerInstance!.trim() })
          .andWhere('job.leaseExpiresAt IS NOT NULL AND job.leaseExpiresAt > :now', { now })
          .getOne();

        if (!callingJob) {
          if (res) res.status(HttpStatus.CONFLICT);
          return { success: false, status: 'lease_lost', message: 'Worker-driven stop rejected: stale or invalid lease' };
        }

        targetCampaignId = callingJob.campaignId;
      }

      if (targetCampaignId) {
        const campaign = await campRepo.findOne({ where: { id: targetCampaignId } });
        if (campaign) {
          let stopStatus = 'stopped_user';
          if (body?.limitReached) stopStatus = 'stopped_limit';
          else if (body?.errorOverflow) stopStatus = 'stopped_error';

          campaign.status = stopStatus;
          await campRepo.save(campaign);

          await jobRepo
            .createQueryBuilder()
            .update(CampaignJob)
            .set({
              status: 'failed',
              errorReason: body?.reason || 'ผู้ใช้สั่งหยุดการส่งแคมเปญ',
              leaseToken: null,
              leaseOwner: null,
              leaseExpiresAt: null,
              leaseHeartbeatAt: null,
            })
            .where('campaignId = :campaignId', { campaignId: targetCampaignId })
            .andWhere('status IN (:...statuses)', { statuses: ['pending', 'processing'] })
            .execute();

          console.log(`🛑 สั่งหยุดแคมเปญ "${campaign.name}": สถานะ ${stopStatus} (เหตุผล: ${body?.reason || 'ผู้ใช้สั่งหยุด'})`);
          this.checkAndSendTelegramReport(campaign).catch(() => {});
        }
      }

      return { success: true };
    });
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

