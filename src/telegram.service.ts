import { Injectable, Logger } from '@nestjs/common';
import { Campaign } from './entities/campaign.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface SafeTelegramConfig {
  chatId: string;
  enabled: boolean;
  botTokenConfigured: boolean;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private configPath: string;
  private config: TelegramConfig = {
    botToken: '',
    chatId: '',
    enabled: false,
  };

  constructor(customConfigPath?: string) {
    this.configPath = customConfigPath || path.join(process.cwd(), 'telegram-config.json');
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = {
          botToken: typeof parsed.botToken === 'string' ? parsed.botToken.trim() : '',
          chatId: typeof parsed.chatId === 'string' ? parsed.chatId.trim() : '',
          enabled: Boolean(parsed.enabled),
        };
      }
    } catch (e) {
      this.logger.error('Failed to load telegram config');
    }
  }

  saveConfig(newConfig: Partial<TelegramConfig>): { success: boolean; message?: string; config?: SafeTelegramConfig } {
    const updatedConfig: TelegramConfig = { ...this.config };

    if (typeof newConfig.chatId === 'string') {
      updatedConfig.chatId = newConfig.chatId.trim();
    }
    if (typeof newConfig.enabled === 'boolean') {
      updatedConfig.enabled = newConfig.enabled;
    }
    if (typeof newConfig.botToken === 'string' && newConfig.botToken.trim() !== '') {
      updatedConfig.botToken = newConfig.botToken.trim();
    }

    this.config = updatedConfig;

    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      this.logger.log('📱 บันทึกการตั้งค่า Telegram เรียบร้อยแล้ว');
      return {
        success: true,
        config: this.getSafeConfig(),
      };
    } catch (e) {
      this.logger.error('Failed to save telegram config');
      return { success: false, message: 'ไม่สามารถบันทึกไฟล์ตั้งค่าได้' };
    }
  }

  getConfig(): TelegramConfig {
    return this.config;
  }

  getSafeConfig(): SafeTelegramConfig {
    return {
      chatId: this.config.chatId || '',
      enabled: Boolean(this.config.enabled),
      botTokenConfigured: Boolean(this.config.botToken && this.config.botToken.trim() !== ''),
    };
  }

  async sendMessage(messageText: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId.trim(),
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const resData = await response.json();
      if (resData && resData.ok) {
        this.logger.log('✅ ส่งแจ้งเตือนรายงานเข้า Telegram สำเร็จ!');
        return true;
      } else {
        this.logger.error(`❌ Telegram API Error: ${resData?.description || 'Unknown error'}`);
        return false;
      }
    } catch (e) {
      this.logger.error('❌ Failed to send Telegram message');
      return false;
    }
  }

  async sendTestMessage(): Promise<{ success: boolean; message: string }> {
    if (!this.config.botToken || !this.config.chatId) {
      return { success: false, message: 'กรุณาระบุ Bot Token และ Chat ID ก่อนทดสอบ' };
    }

    try {
      const testMsg = `<b>🤖 [ทดสอบระบบแจ้งเตือน LineSync Plus]</b>\n` +
                      `━━━━━━━━━━━━━━━━━━━\n` +
                      `✅ ระบบการเชื่อมต่อ Telegram ทำงานถูกต้อง!\n` +
                      `🕒 เวลาทดสอบ: ${new Date().toLocaleString('th-TH')}\n` +
                      `━━━━━━━━━━━━━━━━━━━\n` +
                      `<i>เมื่อจบรอบการส่งแคมเปญ ระบบจะส่งสรุปรายงานผลแบบละเอียดมาที่นี่ครับ</i>`;

      const url = `https://api.telegram.org/bot${this.config.botToken.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId.trim(),
          text: testMsg,
          parse_mode: 'HTML',
        }),
      });

      const resData = await response.json();
      if (resData && resData.ok) {
        return { success: true, message: 'ส่งข้อความทดสอบเข้า Telegram เรียบร้อยแล้ว!' };
      } else {
        return { success: false, message: `Telegram Error: ${resData?.description || 'Unknown error'}` };
      }
    } catch (e) {
      return { success: false, message: 'เชื่อมต่อไม่สำเร็จ' };
    }
  }

  async sendCampaignReport(campaign: Campaign, topReasons: string[] = []): Promise<boolean> {
    if (!this.config.enabled) return false;

    let statusText = '✅ ส่งสำเร็จครบถ้วน';
    if (campaign.status === 'stopped_limit') statusText = '🛑 หยุดส่งอัตโนมัติ (โควต้า LINE เต็ม)';
    else if (campaign.status === 'stopped_error') statusText = '🚨 หยุดฉุกเฉิน (พบ Error ติดต่อกัน 10 ครั้ง)';
    else if (campaign.status === 'stopped_user') statusText = '⏹️ สั่งหยุดโดยผู้ใช้งาน';
    else if (campaign.status === 'failed') statusText = '❌ ส่งไม่ผ่าน/ล้มเหลว';

    const successPct = campaign.totalTargets > 0 
      ? Math.round((campaign.successCount / campaign.totalTargets) * 100) 
      : 0;

    const schedDt = campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString('th-TH') : 'ส่งทันที';
    const startDt = campaign.startedAt ? new Date(campaign.startedAt).toLocaleString('th-TH') : new Date(campaign.createdAt).toLocaleString('th-TH');
    const endDt = campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleString('th-TH') : '-';

    let durationText = '-';
    if (campaign.startedAt && campaign.updatedAt) {
      const diffMs = new Date(campaign.updatedAt).getTime() - new Date(campaign.startedAt).getTime();
      if (diffMs > 0) {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        durationText = mins > 0 ? `${mins} นาที ${secs} วินาที` : `${secs} วินาที`;
      }
    }

    const messageTypeThaiMap: Record<string, string> = {
      text_link: '💬 ข้อความ + 🔗 ลิงก์',
      text: '💬 ข้อความธรรมดา',
      image_link: '🖼️ รูปภาพ + 🔗 ลิงก์',
      image_only: '🖼️ รูปภาพอย่างเดียว',
      link_only: '🔗 ลิงก์อย่างเดียว',
    };
    const typeText = messageTypeThaiMap[campaign.messageType] || campaign.messageType || '💬 ข้อความ';

    let reportMsg = `<b>📊 [สรุปรายงานผลการส่งแคมเปญ]</b>\n`;
    reportMsg += `━━━━━━━━━━━━━━━━━━━\n`;
    reportMsg += `🚀 <b>ชื่อแคมเปญ:</b> ${campaign.name || 'แคมเปญบรอดแคสต์'}\n`;
    reportMsg += `📌 <b>สถานะ:</b> ${statusText}\n`;
    reportMsg += `✉️ <b>ประเภท:</b> ${typeText}\n\n`;
    reportMsg += `🎯 <b>เป้าหมายรวม:</b> ${campaign.totalTargets.toLocaleString()} คน\n`;
    reportMsg += `✅ <b>ส่งสำเร็จ:</b> ${campaign.successCount.toLocaleString()} คน (${successPct}%)\n`;
    reportMsg += `❌ <b>ส่งไม่ผ่าน/บล็อก:</b> ${campaign.failedCount.toLocaleString()} คน\n\n`;
    reportMsg += `📅 <b>กำหนดเวลาส่ง:</b> ${schedDt}\n`;
    reportMsg += `⚡ <b>เริ่มรันเมื่อ:</b> ${startDt}\n`;
    reportMsg += `🏁 <b>เสร็จสิ้นเมื่อ:</b> ${endDt}\n`;
    reportMsg += `⏱️ <b>เวลาที่ใช้รวม:</b> ${durationText}\n`;

    if (topReasons.length > 0) {
      reportMsg += `\n⚠️ <b>สาเหตุที่ล้มเหลวหลัก:</b>\n`;
      topReasons.slice(0, 3).forEach(r => {
        reportMsg += `• ${r}\n`;
      });
    }

    reportMsg += `━━━━━━━━━━━━━━━━━━━\n`;
    reportMsg += `🤖 <i>ส่งอัตโนมัติจาก LineSync Plus Bot</i>`;

    return this.sendMessage(reportMsg);
  }
}
