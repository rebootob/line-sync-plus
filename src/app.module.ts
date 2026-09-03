import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerGroupMember } from './entities/customer-group-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignJob } from './entities/campaign-job.entity';
import { CampaignSendPart } from './entities/campaign-send-part.entity';
import { OaRuntimeState } from './entities/oa-runtime-state.entity';
import { AppController } from './app.controller';
import { DatabaseInitService } from './database-init.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'pg@1234',
      database: process.env.DB_NAME || 'line_sync_db',
      entities: [Customer, CustomerGroup, CustomerGroupMember, Campaign, CampaignJob, CampaignSendPart, OaRuntimeState],
      synchronize: false, // ⚠️ กำหนดเป็น false เพื่อป้องกันไม่ให้ NestJS ไปสร้างตารางใหม่ทับข้อมูลเดิม
    }),
    TypeOrmModule.forFeature([
      Customer,
      CustomerGroup,
      CustomerGroupMember,
      Campaign,
      CampaignJob,
      CampaignSendPart,
      OaRuntimeState,
    ]),
  ],
  controllers: [AppController],
  providers: [DatabaseInitService, TelegramService],
})
export class AppModule {}