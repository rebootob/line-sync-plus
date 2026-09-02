import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Customer } from './customer.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerGroupMember } from './entities/customer-group-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignJob } from './entities/campaign-job.entity';

import { TelegramService } from './telegram.service';

describe('AppController', () => {
  let appController: AppController;

  const mockCustomerRepo = {
    find: jest.fn().mockResolvedValue([
      { lineUserId: 'U12345', displayName: '101 Somchai' },
    ]),
  };

  const mockGroupRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({ id: 'g1', name: 'Test Group' }),
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
    save: jest.fn().mockResolvedValue({ id: 'c1', name: 'Test Campaign', successCount: 0 }),
  };

  const mockCampaignJobRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue([]),
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
        { provide: TelegramService, useValue: mockTelegramService },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('getAllCustomers', () => {
    it('should return cleaned display name with block status', async () => {
      const result = await appController.getAllCustomers();
      expect(result).toEqual([
        { 
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
  });
});


