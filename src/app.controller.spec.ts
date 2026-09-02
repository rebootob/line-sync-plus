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
    const path = require('path');
    const logFilePath = path.join(process.cwd(), 'uat-logs', 'browser-BUG-WP001-UAT.log');

    it('should successfully log allowed browser diagnostic event from local request', async () => {
      const mockReq: any = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      const result = await appController.logBrowserEvent(
        {
          event: 'JOB_RECEIVED',
          jobId: 'job_test_1',
          expectedUserId: 'U12345',
          currentPath: '/bot1/chat/U12345?query=secret#hash',
          retryCount: 0,
          // Forbidden / arbitrary fields
          message: 'SECRET_MESSAGE_TEXT',
          imageUrl: 'https://secret.url/img.png',
          linkUrl: 'https://secret.url/link',
          arbitraryExtraField: 'HACK',
        },
        mockReq,
      );

      expect(result).toEqual({ success: true });

      // Read last line written to log file
      const content = fs.readFileSync(logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const lastLineJson = JSON.parse(lines[lines.length - 1]);

      // 1. Allowed event logged
      expect(lastLineJson.event).toBe('JOB_RECEIVED');
      // 2. Query and hash stripped from currentPath
      expect(lastLineJson.currentPath).toBe('/bot1/chat/U12345');
      // 3. Forbidden fields NOT present
      expect(lastLineJson.message).toBeUndefined();
      expect(lastLineJson.imageUrl).toBeUndefined();
      expect(lastLineJson.linkUrl).toBeUndefined();
      // 4. Extra arbitrary fields NOT present
      expect(lastLineJson.arbitraryExtraField).toBeUndefined();
    });

    it('should reject non-local remote requests', async () => {
      const mockRemoteReq: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: { remoteAddress: '203.0.113.195' },
      };

      const result = await appController.logBrowserEvent(
        {
          event: 'JOB_RECEIVED',
          jobId: 'job_remote_hack',
        },
        mockRemoteReq,
      );

      expect(result).toEqual({
        success: false,
        message: 'Forbidden: Local requests only',
      });
    });

    it('should replace unapproved event names with UNKNOWN', async () => {
      const mockReq: any = {
        headers: {},
        socket: { remoteAddress: '::1' },
      };

      const result = await appController.logBrowserEvent(
        {
          event: 'MALICIOUS_UNAPPROVED_EVENT',
          jobId: 'job_test_2',
        },
        mockReq,
      );

      expect(result).toEqual({ success: true });

      const content = fs.readFileSync(logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      const lastLineJson = JSON.parse(lines[lines.length - 1]);
      expect(lastLineJson.event).toBe('UNKNOWN');
    });
  });
});


