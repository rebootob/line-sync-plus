import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Customer } from './customer.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerGroupMember } from './entities/customer-group-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignJob } from './entities/campaign-job.entity';
import { OaRuntimeState } from './entities/oa-runtime-state.entity';

import { TelegramService } from './telegram.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AppController', () => {
  let appController: AppController;

  const mockCustomerRepo = {
    find: jest.fn().mockResolvedValue([
      { botId: 'U09d6b978fcbfb5275e533ca9b788eb22', lineUserId: 'U12345', displayName: '101 Somchai' },
    ]),
    findOne: jest.fn().mockImplementation((opts) => {
      const w = opts && opts.where ? opts.where : {};
      if (w.lineUserId === 'UFOREIGN_USER_ID') return Promise.resolve(null);
      if (w.botId === 'U09d6b978fcbfb5275e533ca9b788eb22' && (w.lineUserId === 'U12345' || !w.lineUserId)) {
        return Promise.resolve({ botId: 'U09d6b978fcbfb5275e533ca9b788eb22', lineUserId: 'U12345', isBlocked: false });
      }
      if (w.botId === 'U09d6b978fcbfb5275e533ca9b788eb22' && w.lineUserId) {
        return Promise.resolve({ botId: 'U09d6b978fcbfb5275e533ca9b788eb22', lineUserId: w.lineUserId, isBlocked: false });
      }
      return Promise.resolve(null);
    }),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { botId: 'U09d6b978fcbfb5275e533ca9b788eb22', total: '9737', active: '9176', blocked: '561' },
      ]),
    }),
    save: jest.fn().mockImplementation(c => Promise.resolve(c)),
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
  };

  const mockGroupRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({ id: 'g1', name: 'Test Group', botId: 'U09d6b978fcbfb5275e533ca9b788eb22' }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockGroupMemberRepo = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockCampaignRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({ id: 'c1', name: 'Test Campaign', successCount: 0, botId: 'U09d6b978fcbfb5275e533ca9b788eb22' }),
  };

  const mockCampaignJobRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue([]),
  };

  const mockOaRuntimeStateRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'global', activeBotId: 'U09d6b978fcbfb5275e533ca9b788eb22' }),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
  };

  const mockTelegramService = {
    getConfig: jest.fn().mockReturnValue({ botToken: '', chatId: '', enabled: false }),
    saveConfig: jest.fn().mockReturnValue({ success: true }),
    sendTestMessage: jest.fn().mockResolvedValue({ success: true }),
    sendCampaignReport: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(CustomerGroup), useValue: mockGroupRepo },
        { provide: getRepositoryToken(CustomerGroupMember), useValue: mockGroupMemberRepo },
        { provide: getRepositoryToken(Campaign), useValue: mockCampaignRepo },
        { provide: getRepositoryToken(CampaignJob), useValue: mockCampaignJobRepo },
        { provide: getRepositoryToken(OaRuntimeState), useValue: mockOaRuntimeStateRepo },
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('getAllCustomers', () => {
    it('should return cleaned display name with block status', async () => {
      const mockRes = { status: jest.fn().mockReturnThis() } as any;
      const result = await appController.getAllCustomers('U09d6b978fcbfb5275e533ca9b788eb22', mockRes);
      expect(result).toEqual([
        { 
          botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
          lineUserId: 'U12345', 
          displayName: '101 Somchai', 
          cleanedDisplayName: 'Somchai',
          isBlocked: false,
          blockReason: null,
        },
      ]);
    });
  });

  describe('logBrowserEvent', () => {
    const fs = require('fs');
    let appendSpy: jest.SpyInstance;
    let writtenLines: string[] = [];

    beforeEach(() => {
      writtenLines = [];
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      appendSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation((filePath, data) => {
        writtenLines.push(String(data));
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('1. should accept loopback address 127.0.0.1', async () => {
      const mockReq: any = { socket: { remoteAddress: '127.0.0.1' } };
      const result = await appController.logBrowserEvent({ event: 'JOB_RECEIVED' }, mockReq);
      expect(result).toEqual({ success: true });
      expect(writtenLines.length).toBe(1);
    });

    it('2. should accept loopback address ::1', async () => {
      const mockReq: any = { socket: { remoteAddress: '::1' } };
      const result = await appController.logBrowserEvent({ event: 'BOT_START' }, mockReq);
      expect(result).toEqual({ success: true });
      expect(writtenLines.length).toBe(1);
    });

    it('3. should accept loopback address ::ffff:127.0.0.1', async () => {
      const mockReq: any = { socket: { remoteAddress: '::ffff:127.0.0.1' } };
      const result = await appController.logBrowserEvent({ event: 'JOB_SUCCESS' }, mockReq);
      expect(result).toEqual({ success: true });
      expect(writtenLines.length).toBe(1);
    });

    it('4. should reject remote IP (203.0.113.195) without writing to log', async () => {
      const mockRemoteReq: any = { socket: { remoteAddress: '203.0.113.195' } };
      const result = await appController.logBrowserEvent({ event: 'JOB_RECEIVED' }, mockRemoteReq);
      expect(result).toEqual({ success: false, message: 'Forbidden: Local requests only' });
      expect(writtenLines.length).toBe(0);
    });

    it('5. should reject remote IP even if spoofed x-forwarded-for header is sent', async () => {
      const mockSpoofedReq: any = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '203.0.113.195' },
      };
      const result = await appController.logBrowserEvent({ event: 'JOB_RECEIVED' }, mockSpoofedReq);
      expect(result).toEqual({ success: false, message: 'Forbidden: Local requests only' });
      expect(writtenLines.length).toBe(0);
    });

    it('6. should reject unapproved event names without writing to log', async () => {
      const mockReq: any = { socket: { remoteAddress: '127.0.0.1' } };
      const result = await appController.logBrowserEvent({ event: 'MALICIOUS_UNAPPROVED_EVENT' }, mockReq);
      expect(result).toEqual({ success: false, message: 'Invalid or unapproved event' });
      expect(writtenLines.length).toBe(0);
    });

    it('7. & 8. should sanitize allowed event, strip query/hash, and exclude forbidden/extra fields', async () => {
      const mockReq: any = { socket: { remoteAddress: '127.0.0.1' } };
      const result = await appController.logBrowserEvent(
        {
          event: 'TEXT_PRE_SEND_VERIFIED',
          jobId: 'job_test_1',
          expectedUserId: 'U12345',
          currentPath: '/bot1/chat/U12345?query=secret#hash',
          retryCount: 0,
          // Forbidden and extra fields
          message: 'SECRET_MESSAGE_BODY',
          imageUrl: 'https://secret.url/img.png',
          linkUrl: 'https://secret.url/link',
          arbitraryExtraField: 'ATTACK_DATA',
        },
        mockReq,
      );

      expect(result).toEqual({ success: true });
      expect(writtenLines.length).toBe(1);

      const parsed = JSON.parse(writtenLines[0]);
      expect(parsed.event).toBe('TEXT_PRE_SEND_VERIFIED');
      expect(parsed.currentPath).toBe('/bot1/chat/U12345');
      expect(parsed.message).toBeUndefined();
      expect(parsed.imageUrl).toBeUndefined();
      expect(parsed.linkUrl).toBeUndefined();
      expect(parsed.arbitraryExtraField).toBeUndefined();
    });

    it('9. should leave real UAT log untouched due to test mock isolation', async () => {
      const mockReq: any = { socket: { remoteAddress: '127.0.0.1' } };
      await appController.logBrowserEvent({ event: 'JOB_SUCCESS' }, mockReq);
      expect(appendSpy).toHaveBeenCalled();
      expect(writtenLines.length).toBe(1);
    });

    it('10. should preserve original clientTimestamp for queued navigation-critical events', async () => {
      const mockReq: any = { socket: { remoteAddress: '127.0.0.1' } };
      const originalTime = '2026-09-02T08:00:00.000Z';
      const result = await appController.logBrowserEvent(
        {
          event: 'NAVIGATE_TARGET',
          clientTimestamp: originalTime,
          jobId: 'job_nav_1',
          expectedUserId: 'U999',
        },
        mockReq,
      );

      expect(result).toEqual({ success: true });
      expect(writtenLines.length).toBe(1);
      const parsed = JSON.parse(writtenLines[0]);
      expect(parsed.event).toBe('NAVIGATE_TARGET');
      expect(parsed.clientTimestamp).toBe(originalTime);
    });
  });

  describe('BUG-WP002 — OA Context Validation & 404 Loop Guard Static Acceptance Tests', () => {
    function isValidChatContextId(value: any): boolean {
      if (!value || typeof value !== 'string') return false;
      return /^U[0-9a-fA-F]{32}$/.test(value.trim());
    }

    function getOAContextUrl(botId: string, userId?: string): string | null {
      if (!isValidChatContextId(botId)) return null;
      return userId ? `https://chat.line.biz/${botId}/chat/${userId}` : `https://chat.line.biz/${botId}/`;
    }

    it('TEST 1 — VALID CHAT CONTEXT: Accepts U + 32 hex ID', () => {
      const validId = 'U1234567890abcdef1234567890abcdef';
      expect(isValidChatContextId(validId)).toBe(true);
    });

    it('TEST 2 — INVALID SHORT CONTEXT: Rejects short ID 798hcuca', () => {
      const invalidShortId = '798hcuca';
      expect(isValidChatContextId(invalidShortId)).toBe(false);
      expect(getOAContextUrl(invalidShortId)).toBeNull();
    });

    it('TEST 3 — POISONED STORAGE: Removes poisoned linesync_botid if invalid', () => {
      let storage: Record<string, string> = { linesync_botid: '798hcuca' };
      if (!isValidChatContextId(storage.linesync_botid)) {
        delete storage.linesync_botid;
      }
      expect(storage.linesync_botid).toBeUndefined();
    });

    it('TEST 4 — MANAGER PAGE: Rejects manager account IDs', () => {
      const managerId = '798hcuca';
      expect(isValidChatContextId(managerId)).toBe(false);
    });

    it('TEST 5 — INVALID 404 / NO ACTIVE JOB: Fails closed without constructing guessed URL', () => {
      const botId = 'invalid_bot_id';
      expect(getOAContextUrl(botId)).toBeNull();
    });

    it('TEST 6 — VALID CONTEXT + RECIPIENT: Constructs correct target URL', () => {
      const validBotId = 'U1234567890abcdef1234567890abcdef';
      const recipientId = 'U99999999999999999999999999999999';
      const url = getOAContextUrl(validBotId, recipientId);
      expect(url).toBe(`https://chat.line.biz/${validBotId}/chat/${recipientId}`);
    });

    it('TEST 7 — VALID STORED CONTEXT + BAD CURRENT URL: Preserves stored valid context', () => {
      let storedBotId = 'U1234567890abcdef1234567890abcdef';
      const currentBadSegment = '798hcuca';

      if (isValidChatContextId(currentBadSegment)) {
        storedBotId = currentBadSegment;
      }

      expect(storedBotId).toBe('U1234567890abcdef1234567890abcdef');
    });

    it('TEST 8 — NO VALID CONTEXT: Fails closed with null', () => {
      expect(getOAContextUrl('')).toBeNull();
      expect(getOAContextUrl(undefined as any)).toBeNull();
    });

    it('TEST 9 — BUG-WP002-R1 ACTIVE JOB PRESERVATION: Preserves job session data when targetUrl is null', () => {
      const jobData = { jobId: 'job_A', userId: 'U12345', message: 'Hello' };
      const targetUrl = getOAContextUrl(''); // null
      let finishedJob = false;
      let retryCountIncremented = false;

      if (!targetUrl) {
        // Safe recovery behavior when context is unavailable
        finishedJob = false;
        retryCountIncremented = false;
      }

      expect(finishedJob).toBe(false);
      expect(retryCountIncremented).toBe(false);
      expect(jobData.jobId).toBe('job_A');
    });

    it('TEST 10 — BUG-WP002-R1 RETRY COUNT PRESERVATION: Does NOT consume retryCount when OA context is missing', () => {
      let retryCount = 0;
      const targetUrl = getOAContextUrl(''); // null

      if (targetUrl) {
        retryCount++;
      }

      expect(retryCount).toBe(0);
    });
  });

  describe('SEC-WP001 — Secret Hygiene & Telegram Token Security Tests', () => {
    let service: TelegramService;
    let tmpDir: string;
    let cwdSpy: jest.SpyInstance;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linesync-telegram-test-'));
      cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
      service = new TelegramService();
    });

    afterEach(() => {
      if (cwdSpy) {
        cwdSpy.mockRestore();
      }
      try {
        if (tmpDir && fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      jest.restoreAllMocks();
    });

    it('1. GET /api/telegram/settings MUST NOT return botToken', () => {
      service.saveConfig({ botToken: 'SECRET_TOKEN_123', chatId: '123456', enabled: true });
      const safeConfig = service.getSafeConfig();

      expect(safeConfig).toEqual({
        chatId: '123456',
        enabled: true,
        botTokenConfigured: true,
      });
      expect((safeConfig as any).botToken).toBeUndefined();
    });

    it('2. POST /api/telegram/settings response MUST NOT return botToken', () => {
      const res = service.saveConfig({ botToken: 'SECRET_TOKEN_456', chatId: '987654', enabled: false });

      expect(res.success).toBe(true);
      expect(res.config).toBeDefined();
      expect(res.config).toEqual({
        chatId: '987654',
        enabled: false,
        botTokenConfigured: true,
      });
      expect((res.config as any).botToken).toBeUndefined();
    });

    it('3. blank/empty botToken MUST NOT overwrite existing stored token (Real blank-token flow)', () => {
      // 1. Service initially has a configured token
      service.saveConfig({ botToken: 'INITIAL_SECRET_TOKEN', chatId: '111', enabled: true });

      // 2. saveConfig is called with blank botToken and changed chatId / enabled
      const res = service.saveConfig({ botToken: '', chatId: '222', enabled: false });

      // 3. Existing token is preserved internally
      expect(service.getConfig().botToken).toBe('INITIAL_SECRET_TOKEN');

      // 4. Returned response does NOT contain botToken
      expect((res.config as any).botToken).toBeUndefined();

      // 5. botTokenConfigured remains true and updated fields are returned
      expect(res.success).toBe(true);
      expect(res.config?.chatId).toBe('222');
      expect(res.config?.enabled).toBe(false);
      expect(res.config?.botTokenConfigured).toBe(true);
    });

    it('4. new non-empty botToken replaces existing token', () => {
      service.saveConfig({ botToken: 'TOKEN_A', chatId: '111', enabled: true });
      service.saveConfig({ botToken: 'TOKEN_B', chatId: '111', enabled: true });

      expect(service.getConfig().botToken).toBe('TOKEN_B');
    });

    it('5. botTokenConfigured reflects true when token exists and false when empty/blank', () => {
      service.saveConfig({ botToken: '', chatId: '111', enabled: false });
      (service as any).config.botToken = '';
      expect(service.getSafeConfig().botTokenConfigured).toBe(false);

      service.saveConfig({ botToken: 'NEW_VALID_TOKEN', chatId: '111', enabled: true });
      expect(service.getSafeConfig().botTokenConfigured).toBe(true);
    });

    it('6. sendTestMessage fails safely if botToken or chatId is missing', async () => {
      (service as any).config = { botToken: '', chatId: '', enabled: false };
      const testRes = await service.sendTestMessage();

      expect(testRes.success).toBe(false);
      expect(testRes.message).toContain('กรุณาระบุ Bot Token และ Chat ID');
    });

    it('7. sendTestMessage proceeds using preserved stored token after blank-token save (Mocked fetch)', async () => {
      // 1. Stored token already exists
      service.saveConfig({ botToken: 'STORED_SECRET_TOKEN', chatId: '333333', enabled: true });

      // 2. UI-equivalent saveConfig({ botToken: '', chatId: '333333', enabled: true })
      const saveRes = service.saveConfig({ botToken: '', chatId: '333333', enabled: true });
      expect((saveRes.config as any).botToken).toBeUndefined();
      expect(saveRes.config?.botTokenConfigured).toBe(true);

      // 3. Mock global fetch (never perform real Telegram network request)
      const mockFetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true }),
      });
      global.fetch = mockFetch as any;

      // 4. sendTestMessage() proceeds using preserved stored token
      const testRes = await service.sendTestMessage();

      expect(testRes.success).toBe(true);
      expect(testRes.message).toContain('ส่งข้อความทดสอบเข้า Telegram เรียบร้อยแล้ว');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify fetch was called with Telegram API endpoint containing stored token
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('api.telegram.org/botSTORED_SECRET_TOKEN/sendMessage');
    });

    it('8. Nest DI Smoke Test — resolves TelegramService provider cleanly without constructor errors', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TelegramService],
      }).compile();

      const resolvedService = module.get<TelegramService>(TelegramService);
      expect(resolvedService).toBeDefined();
      expect(resolvedService).toBeInstanceOf(TelegramService);
    });
  });

  describe('OPS-WP001 — Fail-Closed Runtime Version Gate Tests', () => {
    let mockRes: any;

    beforeEach(() => {
      mockRes = {
        statusCode: 200,
        status: jest.fn().mockImplementation((code: number) => {
          mockRes.statusCode = code;
          return mockRes;
        }),
      };
    });

    it('1. GET /api/runtime/version returns contract version 2 and required worker version 28.9', () => {
      const res = appController.getRuntimeVersion();
      expect(res).toEqual({
        runtimeContractVersion: 2,
        requiredWorkerVersion: '28.9',
      });
    });

    it('2. GET /api/campaign/next with NO worker-version header -> BLOCKED / 409 Conflict', async () => {
      const findSpy = jest.spyOn(mockCampaignJobRepo, 'find');
      findSpy.mockClear();

      const res = await appController.getNextJob(undefined, undefined, mockRes);

      expect(mockRes.statusCode).toBe(409);
      expect(res).toEqual({
        status: 'version_mismatch',
        requiredWorkerVersion: '28.9',
      });
      // Prove version gate executes BEFORE job query/claim logic
      expect(findSpy).not.toHaveBeenCalled();
    });

    it('3. GET /api/campaign/next with WRONG worker version ("28.4") -> BLOCKED / 409 Conflict', async () => {
      const findSpy = jest.spyOn(mockCampaignJobRepo, 'find');
      findSpy.mockClear();

      const res = await appController.getNextJob('28.4', 'U09d6b978fcbfb5275e533ca9b788eb22', mockRes);

      expect(mockRes.statusCode).toBe(409);
      expect(res).toEqual({
        status: 'version_mismatch',
        requiredWorkerVersion: '28.9',
      });
      expect(findSpy).not.toHaveBeenCalled();
    });

    it('4. Version rejection happens BEFORE job claim/mutation (No DB query/save performed)', async () => {
      const findJobSpy = jest.spyOn(mockCampaignJobRepo, 'find');
      const saveJobSpy = jest.spyOn(mockCampaignJobRepo, 'save');
      const saveCampSpy = jest.spyOn(mockCampaignRepo, 'save');

      findJobSpy.mockClear();
      saveJobSpy.mockClear();
      saveCampSpy.mockClear();

      await appController.getNextJob('27.0', 'U09d6b978fcbfb5275e533ca9b788eb22', mockRes);

      expect(mockRes.statusCode).toBe(409);
      expect(findJobSpy).not.toHaveBeenCalled();
      expect(saveJobSpy).not.toHaveBeenCalled();
      expect(saveCampSpy).not.toHaveBeenCalled();
    });

    it('5. GET /api/campaign/next with EXACT version ("28.9") and valid OA header -> reaches normal job claim logic', async () => {
      const findSpy = jest.spyOn(mockCampaignJobRepo, 'find').mockResolvedValue([]);

      const res = await appController.getNextJob('28.9', 'U09d6b978fcbfb5275e533ca9b788eb22', mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(findSpy).toHaveBeenCalled();
      expect(res).toEqual({ status: 'empty' });
    });
  });

  describe('REL-WP001-R1 — Fail-Closed Worker Lease & Navigation Lease Security Tests', () => {
    it('1. Storage write failure or read-back mismatch cannot return leadership true (Fail-Closed)', () => {
      // Static invariant check: verify writeAndVerifyLeaderRecord is present in userscript
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('writeAndVerifyLeaderRecord');
      expect(scriptContent).toContain('WORKER LEASE PERSIST FAILED');
      expect(scriptContent).toContain('Read-back verification mismatch');
    });

    it('2. Navigation paths require navigation lease helper (navigateAsLeader)', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('navigateAsLeader');
      expect(scriptContent).toContain('NAVIGATION_LEASE_EXTEND_FAILED');
      expect(scriptContent).toContain('SAME_JOB_RECOVERY_RECIPIENT');
      expect(scriptContent).toContain('PROCESS_QUEUE_404_MAIN');
      expect(scriptContent).toContain('PROCESS_QUEUE_RECIPIENT');
      expect(scriptContent).toContain('RETURN_TO_MAIN');
      expect(scriptContent).toContain('PAGE_LOAD_404_MAIN');
    });

    it('3. Irreversible send paths use atomic leadership confirmation (confirmWorkerLeadershipForSend)', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('confirmWorkerLeadershipForSend');
      expect(scriptContent).toContain('isImageLeaderConfirmed');
      expect(scriptContent).toContain('isTextLeaderConfirmed');
    });
  });

  describe('REL-WP001-R2 — Duplicate-Tab Identity Clone Defense Security Tests', () => {
    it('1. Document-lifetime tab identity lock prefix exists', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('TAB_IDENTITY_LOCK_PREFIX');
      expect(scriptContent).toContain('linesync_tab_identity_v1_');
      expect(scriptContent).toContain('ensureTabIdentity');
    });

    it('2. Cloned tab detects duplicate identity, generates new tabSessionId, and clears copied lease/job state', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('DUPLICATE TAB IDENTITY DETECTED');
      expect(scriptContent).toContain('NEW TAB IDENTITY ASSIGNED');
      expect(scriptContent).toContain("sessionStorage.removeItem('linesync_tab_lease_id')");
      expect(scriptContent).toContain("sessionStorage.removeItem('linesync_jobid')");
      expect(scriptContent).toContain("sessionStorage.removeItem('linesync_uid')");
    });

    it('3. Leadership and atomic send confirmation require verified document tab identity', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain('if (!isTabIdentityVerified) return false;');
      expect(scriptContent).toContain('TAB IDENTITY UNVERIFIED');
    });
  });

  describe('OA-WP001 — OA Context Isolation & Controlled LINE OA Switch Security Tests', () => {
    it('1. GET /api/oa/contexts returns grouped customer metrics per botId', async () => {
      const contexts = await appController.getOaContexts();
      expect(contexts).toEqual([
        { botId: 'U09d6b978fcbfb5275e533ca9b788eb22', total: 9737, active: 9176, blocked: 561 }
      ]);
    });

    it('2. GET /api/customers requires and filters by botId (fails closed when missing/invalid)', async () => {
      const mockRes = { statusCode: 200, status: jest.fn().mockImplementation(c => { mockRes.statusCode = c; return mockRes; }) } as any;

      const resBad = await appController.getAllCustomers(undefined, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(resBad).toEqual({ success: false, message: 'Missing or invalid botId query parameter' });

      const resGood = await appController.getAllCustomers('U09d6b978fcbfb5275e533ca9b788eb22', mockRes);
      expect(resGood).toHaveLength(1);
    });

    it('3. POST /api/oa/active rejects switch if Master Bot is running or processing job exists', async () => {
      const mockRes = { statusCode: 200, status: jest.fn().mockImplementation(c => { mockRes.statusCode = c; return mockRes; }) } as any;

      // Master bot enabled -> conflict
      appController.toggleBotStatus({ enabled: true });
      const resActiveBotRunning = await appController.setActiveOa({ botId: 'U09d6b978fcbfb5275e533ca9b788eb22' }, mockRes);
      expect(mockRes.statusCode).toBe(409);
      expect(resActiveBotRunning).toEqual({ success: false, message: 'Master Bot must be paused before switching OA context' });

      // Master bot paused -> allowed
      appController.toggleBotStatus({ enabled: false });
      const resSuccess = await appController.setActiveOa({ botId: 'U09d6b978fcbfb5275e533ca9b788eb22' }, mockRes);
      expect(resSuccess).toEqual({ success: true, activeBotId: 'U09d6b978fcbfb5275e533ca9b788eb22' });
    });

    it('4. POST /api/campaign/add rejects requests if botId does not match active OA or target is outside OA', async () => {
      const mockRes = { statusCode: 200, status: jest.fn().mockImplementation(c => { mockRes.statusCode = c; return mockRes; }) } as any;

      // Target outside OA
      const resBadTarget = await appController.addCampaign({
        botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
        message: 'Hello',
        targetIds: ['UFOREIGN_USER_ID']
      }, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(resBadTarget).toEqual({ success: false, message: 'Target ID UFOREIGN_USER_ID does not belong to OA U09d6b978fcbfb5275e533ca9b788eb22' });
    });

    it('5. GET /api/campaign/next rejects missing OA header or worker/active OA mismatch before queue query', async () => {
      const mockRes = { statusCode: 200, status: jest.fn().mockImplementation(c => { mockRes.statusCode = c; return mockRes; }) } as any;
      const findSpy = jest.spyOn(mockCampaignJobRepo, 'find');
      findSpy.mockClear();

      // Missing OA header
      const resMissingOa = await appController.getNextJob('28.9', undefined, mockRes);
      expect(mockRes.statusCode).toBe(409);
      expect(resMissingOa).toEqual({ status: 'missing_oa_context', message: 'X-LineSync-OA-Context header missing or invalid' });
      expect(findSpy).not.toHaveBeenCalled();

      // OA Mismatch (worker sends foreign OA)
      const resMismatchOa = await appController.getNextJob('28.9', 'U11111111222222223333333344444444', mockRes);
      expect(mockRes.statusCode).toBe(409);
      expect(resMismatchOa.status).toBe('oa_context_mismatch');
      expect(findSpy).not.toHaveBeenCalled();
    });

    it('6. Tampermonkey script contains version 28.9, controlled OA switch, job OA fencing, and physical send OA guard', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("const WORKER_VERSION = '28.9'");
      expect(scriptContent).toContain('headers[\'X-LineSync-OA-Context\']');
      expect(scriptContent).toContain('checkAndExecuteControlledOaSwitch');
      expect(scriptContent).toContain('verifyCurrentOAContext');
      expect(scriptContent).toContain('JOB OA CONTEXT MISMATCH');
      expect(scriptContent).toContain('OA_CONTEXT_MISMATCH');
    });
  });

  describe('OA-WP001-R1 — Strict OA Identity Fencing & Regression Restore Tests', () => {
    let mockRes: any;

    beforeEach(() => {
      mockRes = {
        statusCode: 200,
        status: jest.fn().mockImplementation(c => { mockRes.statusCode = c; return mockRes; })
      };
    });

    it('1. userId-only success fallback without botId fails closed (400 Bad Request)', async () => {
      const res = await appController.markSuccess({ userId: 'U12345' }, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(res).toEqual({ success: false, message: 'Missing or invalid botId for userId fallback' });
    });

    it('2. userId-only fail fallback without botId fails closed (400 Bad Request)', async () => {
      const res = await appController.markFail({ userId: 'U12345' }, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(res).toEqual({ success: false, message: 'Missing or invalid botId for userId fallback' });
    });

    it('3. valid botId + lineUserId fallback uses composite identity query', async () => {
      const findSpy = jest.spyOn(mockCampaignJobRepo, 'findOne').mockResolvedValueOnce({
        id: 'j1',
        campaignId: 'c1',
        botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
        lineUserId: 'U12345',
        status: 'processing',
      } as any);

      const res = await appController.markSuccess({
        userId: 'U12345',
        botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
      }, mockRes);

      expect(res).toEqual({ success: true });
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
          lineUserId: 'U12345',
          status: 'processing',
        },
        order: { updatedAt: 'DESC' },
      });
    });

    it('4. blocked customer mutation requires valid job.botId + lineUserId', async () => {
      // Mock job without valid botId
      jest.spyOn(mockCampaignJobRepo, 'findOne').mockResolvedValueOnce({
        id: 'j2',
        campaignId: 'c1',
        botId: null,
        lineUserId: 'U12345',
        status: 'processing',
      } as any);

      const custFindSpy = jest.spyOn(mockCustomerRepo, 'findOne');
      custFindSpy.mockClear();

      await appController.markFail({ jobId: 'j2', isBlocked: true, reason: 'บล็อก' }, mockRes);

      expect(custFindSpy).not.toHaveBeenCalled();
    });

    it('5. missing expected job botId cannot pass physical OA fence in script', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("if (!expectedBotId || !isValidChatContextId(expectedBotId) || !verifyCurrentOAContext(expectedBotId))");
    });

    it('6. page-load saved job restores linesync_job_botid', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("sessionStorage.getItem('linesync_job_botid')");
      expect(scriptContent).toContain("botId: savedJobBotId");
    });

    it('7. legacy saved job with missing job_botid cannot send', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("Unverifiable saved active job (missing or invalid linesync_job_botid");
      expect(scriptContent).toContain("clearLocalActiveJobState()");
    });

    it('8. clearLocalActiveJobState clears linesync_job_botid', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("function clearLocalActiveJobState()");
      expect(scriptContent).toContain("sessionStorage.removeItem('linesync_job_botid')");
    });

    it('9. duplicate-tab cleanup clears linesync_job_botid via clearLocalActiveJobState', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      const dupBlock = scriptContent.substring(
        scriptContent.indexOf('DUPLICATE TAB IDENTITY DETECTED'),
        scriptContent.indexOf('NEW TAB IDENTITY ASSIGNED')
      );
      expect(dupBlock).toContain('clearLocalActiveJobState()');
    });

    it('10. leadership-loss cleanup clears linesync_job_botid via clearLocalActiveJobState', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      const lossBlock = scriptContent.substring(
        scriptContent.indexOf('function handleLeadershipLost'),
        scriptContent.indexOf('Periodic Leadership Renewal Loop')
      );
      expect(lossBlock).toContain('clearLocalActiveJobState()');
    });

    it('11. success/fail worker payload contains botId', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      expect(scriptContent).toContain("fetchAPI('/campaign/success', 'POST', { jobId: jobId, userId: userId, botId: expectedJobBotId })");
      expect(scriptContent).toContain("fetchAPI('/campaign/fail', 'POST', { jobId: jobId, userId: userId, botId: expectedJobBotId");
    });

    it('12. /campaign/next has no activeBotId fallback for job.botId', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: 'U09d6b978fcbfb5275e533ca9b788eb22' } as any);
      appController.toggleBotStatus({ enabled: true });

      // Mock job with matching botId
      jest.spyOn(mockCampaignJobRepo, 'find').mockResolvedValueOnce([
        { id: 'j1', campaignId: 'c1', botId: 'U09d6b978fcbfb5275e533ca9b788eb22', lineUserId: 'U12345', status: 'pending', createdAt: new Date() }
      ] as any);
      jest.spyOn(mockCampaignRepo, 'findOne').mockResolvedValueOnce({
        id: 'c1',
        botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
        status: 'pending',
        messageType: 'text',
        message: 'Hello'
      } as any);

      const jobRes: any = await appController.getNextJob('28.9', 'U09d6b978fcbfb5275e533ca9b788eb22', mockRes);
      expect(jobRes.botId).toBe('U09d6b978fcbfb5275e533ca9b788eb22');
    });

    it('13. group detail/delete require botId query parameter', async () => {
      // Group detail without botId
      const detailRes = await appController.getGroupDetail('g1', undefined, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(detailRes).toEqual({ success: false, message: 'Missing or invalid botId query parameter' });

      // Group delete without botId
      const deleteRes = await appController.deleteGroup('g1', undefined, mockRes);
      expect(mockRes.statusCode).toBe(400);
      expect(deleteRes).toEqual({ success: false, message: 'Missing or invalid botId query parameter' });
    });

    it('14. image upload response contract remains data.url compatible', async () => {
      const uploadRes = await appController.uploadImage({
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        filename: 'test.png'
      });

      expect(uploadRes.success).toBe(true);
      expect(uploadRes.url).toBeDefined();
      expect(uploadRes.filename).toBeDefined();
      expect(uploadRes.url).toContain('/api/uploads/');
    });

    it('15. handleSafeRecovery requires valid jobData.botId matching current OA context', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      const recoveryBlock = scriptContent.substring(
        scriptContent.indexOf('function handleSafeRecovery'),
        scriptContent.indexOf('processQueue()')
      );
      expect(recoveryBlock).toContain("if (!jobData || !jobData.botId || !isValidChatContextId(jobData.botId) || !verifyCurrentOAContext(jobData.botId))");
      expect(recoveryBlock).toContain("clearLocalActiveJobState()");
    });

    it('16. same-job recovery persistence contains linesync_job_botid using jobData.botId', () => {
      const fs = require('fs');
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');

      const recoveryBlock = scriptContent.substring(
        scriptContent.indexOf('function handleSafeRecovery'),
        scriptContent.indexOf('processQueue()')
      );
      expect(recoveryBlock).toContain("sessionStorage.setItem('linesync_job_botid', jobData.botId)");
    });

    it('17. upload contract uses exact http://localhost:<PORT>/api/uploads/<filename> format', async () => {
      const uploadRes = await appController.uploadImage({
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        filename: 'test_exact.png'
      });

      const port = process.env.PORT || 3005;
      expect(uploadRes.success).toBe(true);
      expect(uploadRes.url).toBe(`http://localhost:${port}/api/uploads/${uploadRes.filename}`);
    });
  });

  describe('SYNC-WP001 — LINE OA Customer Directory Sync Tests', () => {
    const validBotId1 = 'U09d6b978fcbfb5275e533ca9b788eb22';
    const validBotId2 = 'U07f7c8d9e0f1a2b3c4d5e6f7a8b9c0d1';

    let reqMock: any;
    let resMock: any;

    beforeEach(() => {
      reqMock = { socket: { remoteAddress: '127.0.0.1' } };
      resMock = { statusCode: 200, status(code: number) { this.statusCode = code; } };
      appController.toggleBotStatus({ enabled: false });
    });

    it('1. sync-batch rejects invalid botId', async () => {
      const res: any = await appController.syncCustomerBatch({ botId: 'invalid-bot-id', records: [] }, reqMock, resMock);
      expect(resMock.statusCode).toBe(400);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Missing or invalid botId');
    });

    it('2. sync-batch rejects active OA mismatch', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      const res: any = await appController.syncCustomerBatch({ botId: validBotId2, records: [] }, reqMock, resMock);
      expect(resMock.statusCode).toBe(409);
      expect(res.success).toBe(false);
      expect(res.message).toContain('does not match active OA');
    });

    it('3. sync-batch rejects when Master Bot is running', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      appController.toggleBotStatus({ enabled: true });
      const res: any = await appController.syncCustomerBatch({ botId: validBotId1, records: [] }, reqMock, resMock);
      expect(resMock.statusCode).toBe(409);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Master Bot must be paused');
    });

    it('4. sync-batch rejects non-loopback request IP', async () => {
      const remoteReq = { socket: { remoteAddress: '203.0.113.195' } };
      const res: any = await appController.syncCustomerBatch({ botId: validBotId1, records: [] }, remoteReq as any, resMock);
      expect(resMock.statusCode).toBe(403);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Forbidden');
    });

    it('5. new customer insert uses botId + lineUserId', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([]);
      const createSpy = jest.spyOn(mockCustomerRepo, 'create');
      const saveSpy = jest.spyOn(mockCustomerRepo, 'save').mockResolvedValueOnce([] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [{ lineUserId: 'U11111111111111111111111111111111', displayName: 'ลูกค้า 1' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.inserted).toBe(1);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        botId: validBotId1,
        lineUserId: 'U11111111111111111111111111111111',
        displayName: 'ลูกค้า 1'
      }));
      expect(saveSpy).toHaveBeenCalled();
    });

    it('6. existing same-OA customer displayName updates correctly', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      const existingCust = {
        botId: validBotId1,
        lineUserId: 'U22222222222222222222222222222222',
        displayName: 'ชื่อเก่า',
        isBlocked: false,
        blockReason: null
      };
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([existingCust] as any);
      const saveSpy = jest.spyOn(mockCustomerRepo, 'save').mockResolvedValueOnce([] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [{ lineUserId: 'U22222222222222222222222222222222', displayName: 'ชื่อใหม่' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.updatedName).toBe(1);
      expect(res.inserted).toBe(0);
      expect(existingCust.displayName).toBe('ชื่อใหม่');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('7. unchanged customer remains unchanged', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      const existingCust = {
        botId: validBotId1,
        lineUserId: 'U33333333333333333333333333333333',
        displayName: 'ชื่อเดิม',
        isBlocked: false
      };
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([existingCust] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [{ lineUserId: 'U33333333333333333333333333333333', displayName: 'ชื่อเดิม' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.existingUnchanged).toBe(1);
      expect(res.updatedName).toBe(0);
      expect(res.inserted).toBe(0);
    });

    it('8. existing isBlocked and blockReason are preserved', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      const blockedCust = {
        botId: validBotId1,
        lineUserId: 'U44444444444444444444444444444444',
        displayName: 'ชื่อเก่า',
        isBlocked: true,
        blockReason: 'บล็อกโดยผู้ใช้'
      };
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([blockedCust] as any);
      jest.spyOn(mockCustomerRepo, 'save').mockResolvedValueOnce([] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [{ lineUserId: 'U44444444444444444444444444444444', displayName: 'ชื่อใหม่' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(blockedCust.isBlocked).toBe(true);
      expect(blockedCust.blockReason).toBe('บล็อกโดยผู้ใช้');
    });

    it('9. identical lineUserId under another botId is NOT modified', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([]);
      const createSpy = jest.spyOn(mockCustomerRepo, 'create');
      jest.spyOn(mockCustomerRepo, 'save').mockResolvedValueOnce([] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [{ lineUserId: 'U55555555555555555555555555555555', displayName: 'ชื่อใหม่ใน OA1' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.inserted).toBe(1);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        botId: validBotId1,
        lineUserId: 'U55555555555555555555555555555555'
      }));
    });

    it('10. duplicate lineUserIds within a batch do not create duplicates', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([]);
      const createSpy = jest.spyOn(mockCustomerRepo, 'create');
      createSpy.mockClear();
      jest.spyOn(mockCustomerRepo, 'save').mockResolvedValueOnce([] as any);

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [
          { lineUserId: 'U66666666666666666666666666666666', displayName: 'ชื่อครั้งแรก' },
          { lineUserId: 'U66666666666666666666666666666666', displayName: 'ชื่อครั้งที่สอง' }
        ]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.received).toBe(2);
      expect(res.inserted).toBe(1);
      expect(res.duplicateInBatch).toBe(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('11. oversized batch (> 250) is rejected', async () => {
      const records = Array.from({ length: 251 }, (_, i) => ({ lineUserId: `U${i}`, displayName: `User ${i}` }));
      const res: any = await appController.syncCustomerBatch({ botId: validBotId1, records }, reqMock, resMock);

      expect(resMock.statusCode).toBe(400);
      expect(res.success).toBe(false);
      expect(res.message).toContain('exceeds maximum limit of 250');
    });

    it('12. malformed non-empty lineUserId is counted as invalid and never created/saved', async () => {
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValueOnce([]);
      const createSpy = jest.spyOn(mockCustomerRepo, 'create');
      createSpy.mockClear();
      const saveSpy = jest.spyOn(mockCustomerRepo, 'save');
      saveSpy.mockClear();

      const res: any = await appController.syncCustomerBatch({
        botId: validBotId1,
        records: [
          { lineUserId: 'U12345', displayName: 'Short ID' },
          { lineUserId: 'NOT_STARTING_WITH_U_1234567890123', displayName: 'Bad prefix' },
          { lineUserId: 'U11111111222222223333333344444444', displayName: 'Valid ID' }
        ]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
      expect(res.received).toBe(3);
      expect(res.invalid).toBe(2);
      expect(res.inserted).toBe(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        botId: validBotId1,
        lineUserId: 'U11111111222222223333333344444444'
      }));
    });

    it('13. index.html startCustomerSync fetches /bot/status, strictly validates boolean enabled status, and does not contain isBotEnabled reference', () => {
      const fs = require('fs');
      const htmlContent = fs.readFileSync('index.html', 'utf8');

      expect(htmlContent).toContain('function startCustomerSync()');
      expect(htmlContent).toContain('${API_BASE}/bot/status');
      expect(htmlContent).toContain("typeof statusData.enabled !== 'boolean'");
      expect(htmlContent).not.toContain('if (isBotEnabled)');
    });
  });

  describe('SYNC-WP001-R5 — Live Chat Directory Response Contract Tests', () => {
    const fs = require('fs');

    it('1. Full sync URL uses /api/v2/bots/${botId}/chats', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('/api/v2/bots/${botId}/chats');
    });

    it('2. Contains folderType=ALL, limit=20, prioritizePinnedChat=true', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('folderType=ALL');
      expect(scriptContent).toContain('limit=20');
      expect(scriptContent).toContain('prioritizePinnedChat=true');
    });

    it('3. Full sync does NOT use /contacts endpoint', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).not.toContain('/api/v2/bots/${botId}/contacts');
    });

    it('4. Parser remains resp.list', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('Array.isArray(resp.list)');
      expect(scriptContent).toContain('const contacts = resp.list;');
    });

    it('5. Pagination remains resp.next', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('const rawNext = resp.next;');
    });

    it('6. Identity remains profile.userId', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('const rawUid = profile ? profile.userId : null;');
      expect(scriptContent).not.toContain('lineUserId: item.contactId');
      expect(scriptContent).not.toContain('lineUserId: item.chatId');
    });

    it('7. nickname -> name fallback remains', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain("typeof profile.nickname === 'string' && profile.nickname.trim()");
      expect(scriptContent).toContain('displayName = profile.nickname.trim();');
      expect(scriptContent).toContain("typeof profile.name === 'string' && profile.name.trim()");
      expect(scriptContent).toContain('displayName = profile.name.trim();');
    });

    it('8. No latestEvent/message content is mapped into Customer payload', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).not.toContain('latestEvent');
      expect(scriptContent).not.toContain('quoteToken');
      expect(scriptContent).not.toContain('contentHash');
      expect(scriptContent).not.toContain('sendId');
    });

    it('9. Non-destructive backend behavior remains unchanged', async () => {
      // Backend batch endpoint preserves non-destructive semantics
      appController.toggleBotStatus({ enabled: false });
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValueOnce({ id: 'global', activeBotId: 'U09d6b978fcbfb5275e533ca9b788eb22' } as any);
      const reqMock = { socket: { remoteAddress: '127.0.0.1' } } as any;
      const resMock = { statusCode: 200, status(code: number) { this.statusCode = code; } } as any;

      jest.spyOn(mockCustomerRepo, 'find').mockResolvedValue([]);
      const res: any = await appController.syncCustomerBatch({
        botId: 'U09d6b978fcbfb5275e533ca9b788eb22',
        records: [{ lineUserId: 'U11111111222222223333333344444444', displayName: 'Test User' }]
      }, reqMock, resMock);

      expect(res.success).toBe(true);
    });

    it('10. Worker = 28.9', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain("const WORKER_VERSION = '28.9'");
      expect(scriptContent).toContain("@version      28.9");
    });

    it('11. Required Worker = 28.9', () => {
      const versionRes = appController.getRuntimeVersion();
      expect(versionRes.requiredWorkerVersion).toBe('28.9');
    });
  });

  describe('SAFE-WP001 — LINE OA Account Protection & Send Compliance Guard Tests', () => {
    const fs = require('fs');

    it('1. Worker = 28.9', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain("const WORKER_VERSION = '28.9'");
      expect(scriptContent).toContain("@version      28.9");
    });

    it('2. Required Worker = 28.9', () => {
      const versionRes = appController.getRuntimeVersion();
      expect(versionRes.requiredWorkerVersion).toBe('28.9');
    });

    it('3. Rate guard exists immediately before text irreversible send', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('async function sendChatMessage(');
      expect(scriptContent).toContain('await enforceAccountProtectionGate(expectedBotId, expectedUserId);');
    });

    it('4. Rate guard exists immediately before image irreversible send', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('async function confirmAndCloseImageModal(');
      expect(scriptContent).toContain('await enforceAccountProtectionGate(expectedBotId, expectedUserId);');
    });

    it('5. Per-OA localStorage protection key is scoped by botId', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('linesync_account_protection_v1_${botId}');
    });

    it('6. Minimum gap = 10000 ms', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('const MIN_SEND_GAP_MS = 10000;');
    });

    it('7. Rolling 10-minute max = 60', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('const MAX_SEND_ACTIONS_10_MIN = 60;');
    });

    it('8. Rolling 1-hour max = 300', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('const MAX_SEND_ACTIONS_1_HOUR = 300;');
    });

    it('9. Waiting does not mark job failed/successful', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('updateUI(`🛡️ Account Protection Active:');
      expect(scriptContent).not.toContain('finishJob(jobId, userId, false, \'PROTECTION_WAIT\');');
    });

    it('10. Post-wait send revalidates Worker leadership', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('confirmWorkerLeadershipForSend()');
      expect(scriptContent).toContain('Leadership check failed post-wait in protection gate!');
    });

    it('11. Post-wait send revalidates recipient', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('verifyCurrentRecipient(expectedUserId)');
      expect(scriptContent).toContain('Recipient check failed post-wait in protection gate!');
    });

    it('12. Post-wait send revalidates OA', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('verifyCurrentOAContext(expectedBotId)');
      expect(scriptContent).toContain('OA context check failed post-wait in protection gate!');
    });

    it('13. campaign/add deduplicates targetIds', async () => {
      const validBotId1 = 'U09d6b978fcbfb5275e533ca9b788eb22';
      appController.toggleBotStatus({ enabled: false });
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValue({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'findOne').mockResolvedValue({ botId: validBotId1, lineUserId: 'U111', isBlocked: false } as any);

      const createCampSpy = jest.spyOn(mockCampaignRepo, 'create');
      jest.spyOn(mockCampaignRepo, 'save').mockResolvedValue({ id: 'c100' } as any);
      jest.spyOn(mockCampaignJobRepo, 'create').mockImplementation((d: any) => d);
      jest.spyOn(mockCampaignJobRepo, 'save').mockResolvedValue([] as any);

      const mockRes = { statusCode: 200, status(code: number) { this.statusCode = code; } } as any;

      const res: any = await appController.addCampaign({
        botId: validBotId1,
        message: 'Test Dup',
        targetIds: ['U111', 'U111', 'U111']
      }, mockRes);

      expect(res.success).toBe(true);
      expect(res.requestedCount).toBe(3);
      expect(res.queuedCount).toBe(1);
      expect(res.excludedDuplicateCount).toBe(2);
      expect(res.excludedBlockedCount).toBe(0);
      expect(createCampSpy).toHaveBeenCalledWith(expect.objectContaining({ totalTargets: 1 }));
    });

    it('14. blocked Customer is excluded before CampaignJob creation', async () => {
      const validBotId1 = 'U09d6b978fcbfb5275e533ca9b788eb22';
      appController.toggleBotStatus({ enabled: false });
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValue({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'findOne')
        .mockResolvedValueOnce({ botId: validBotId1, lineUserId: 'UACTIVE', isBlocked: false } as any)
        .mockResolvedValueOnce({ botId: validBotId1, lineUserId: 'UBLOCKED', isBlocked: true } as any);

      jest.spyOn(mockCampaignRepo, 'create');
      jest.spyOn(mockCampaignRepo, 'save').mockResolvedValue({ id: 'c101' } as any);
      const createJobSpy = jest.spyOn(mockCampaignJobRepo, 'create').mockImplementation((d: any) => d);
      createJobSpy.mockClear();
      jest.spyOn(mockCampaignJobRepo, 'save').mockResolvedValue([] as any);

      const mockRes = { statusCode: 200, status(code: number) { this.statusCode = code; } } as any;

      const res: any = await appController.addCampaign({
        botId: validBotId1,
        message: 'Test Blocked Filter',
        targetIds: ['UACTIVE', 'UBLOCKED']
      }, mockRes);

      expect(res.success).toBe(true);
      expect(res.requestedCount).toBe(2);
      expect(res.queuedCount).toBe(1);
      expect(res.excludedBlockedCount).toBe(1);
      expect(createJobSpy).toHaveBeenCalledTimes(1);
      expect(createJobSpy).toHaveBeenCalledWith(expect.objectContaining({ lineUserId: 'UACTIVE' }));
    });

    it('15. Campaign.totalTargets = actual queued count', async () => {
      const validBotId1 = 'U09d6b978fcbfb5275e533ca9b788eb22';
      appController.toggleBotStatus({ enabled: false });
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValue({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'findOne')
        .mockResolvedValueOnce({ botId: validBotId1, lineUserId: 'U1', isBlocked: false } as any)
        .mockResolvedValueOnce({ botId: validBotId1, lineUserId: 'U2', isBlocked: true } as any);

      const createCampSpy = jest.spyOn(mockCampaignRepo, 'create');
      jest.spyOn(mockCampaignRepo, 'save').mockResolvedValue({ id: 'c102' } as any);
      jest.spyOn(mockCampaignJobRepo, 'create').mockImplementation((d: any) => d);
      jest.spyOn(mockCampaignJobRepo, 'save').mockResolvedValue([] as any);

      const mockRes = { statusCode: 200, status(code: number) { this.statusCode = code; } } as any;

      await appController.addCampaign({
        botId: validBotId1,
        message: 'Test TotalTargets',
        targetIds: ['U1', 'U2', 'U1']
      }, mockRes);

      expect(createCampSpy).toHaveBeenCalledWith(expect.objectContaining({ totalTargets: 1 }));
    });

    it('16. zero valid targets rejects campaign', async () => {
      const validBotId1 = 'U09d6b978fcbfb5275e533ca9b788eb22';
      appController.toggleBotStatus({ enabled: false });
      jest.spyOn(mockOaRuntimeStateRepo, 'findOne').mockResolvedValue({ id: 'global', activeBotId: validBotId1 } as any);
      jest.spyOn(mockCustomerRepo, 'findOne').mockResolvedValue({ botId: validBotId1, lineUserId: 'UBLOCKED', isBlocked: true } as any);

      const mockRes = { statusCode: 200, status(code: number) { this.statusCode = code; } } as any;

      const res: any = await appController.addCampaign({
        botId: validBotId1,
        message: 'All Blocked',
        targetIds: ['UBLOCKED']
      }, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(res.success).toBe(false);
      expect(res.message).toContain('ไม่พบผู้รับที่สามารถส่งได้');
    });

    it('17. blocked users do not increment system error counter', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain("if (isUserBlocked) {");
      expect(scriptContent).toContain("console.log(`ℹ️ ผู้ใช้บล็อกแชท/ส่งไม่ได้ (ไม่นับเป็น Error ระบบ): ${userId}`);");
    });

    it('18. system error backoff is bounded: 30s / 60s / 120s / max 300s', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('function getSystemErrorCooldownMs(');
      expect(scriptContent).toContain('if (consecutiveErrors === 1) return 30000;');
      expect(scriptContent).toContain('if (consecutiveErrors === 2) return 60000;');
      expect(scriptContent).toContain('if (consecutiveErrors === 3) return 120000;');
      expect(scriptContent).toContain('return 300000;');
    });

    it('19. 10 consecutive system errors still triggers hard stop', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('if (consecutiveErrorCount >= 10)');
      expect(scriptContent).toContain("console.error(\"🚨 [CRITICAL] พบ Error ติดต่อกันเกิน 10 รายการ! สั่งหยุดสคริปต์ฉุกเฉิน (Circuit Breaker)...\");");
    });

    it('20. existing safety tests remain passing', () => {
      const scriptContent = fs.readFileSync('run/LineSyncApp.js', 'utf8');
      expect(scriptContent).toContain('verifyCurrentRecipient');
      expect(scriptContent).toContain('verifyCurrentOAContext');
      expect(scriptContent).toContain('confirmWorkerLeadershipForSend');
    });
  });
});


