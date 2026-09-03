import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      this.logger.log('🛠️ Checking database schema for LineSync Plus tables...');

      await this.dataSource.query(`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS "isBlocked" boolean DEFAULT false;
      `);

      await this.dataSource.query(`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS "blockReason" text;
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS customer_groups (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "name" character varying(255) NOT NULL,
          "description" text,
          "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_customer_groups_id" PRIMARY KEY ("id")
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS customer_group_members (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "groupId" character varying(255) NOT NULL,
          "lineUserId" character varying(50) NOT NULL,
          "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_customer_group_members_id" PRIMARY KEY ("id")
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "name" character varying(255),
          "messageType" character varying(50) NOT NULL DEFAULT 'text',
          "message" text NOT NULL,
          "imageUrl" text,
          "linkUrl" text,
          "totalTargets" integer NOT NULL DEFAULT 0,
          "successCount" integer NOT NULL DEFAULT 0,
          "failedCount" integer NOT NULL DEFAULT 0,
          "status" character varying(50) NOT NULL DEFAULT 'pending',
          "scheduledAt" TIMESTAMP WITHOUT TIME ZONE,
          "startedAt" TIMESTAMP WITHOUT TIME ZONE,
          "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_campaigns_id" PRIMARY KEY ("id")
        );
      `);

      await this.dataSource.query(`
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP WITHOUT TIME ZONE;
      `);

      await this.dataSource.query(`
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP WITHOUT TIME ZONE;
      `);

      try {
        await this.dataSource.query(`
          ALTER TABLE campaigns ALTER COLUMN "scheduledAt" TYPE TIMESTAMP WITHOUT TIME ZONE USING "scheduledAt"::timestamp without time zone;
        `);
      } catch (e) {}

      try {
        await this.dataSource.query(`
          ALTER TABLE campaigns ALTER COLUMN "startedAt" TYPE TIMESTAMP WITHOUT TIME ZONE USING "startedAt"::timestamp without time zone;
        `);
      } catch (e) {}

      // แก้ไขข้อมูลเก่าที่ถูกเพี้ยนจากการแปลง Timezone ก่อนหน้า
      try {
        await this.dataSource.query(`
          UPDATE campaigns 
          SET "scheduledAt" = "createdAt" + INTERVAL '3 minutes'
          WHERE "scheduledAt" IS NOT NULL AND "scheduledAt" < "createdAt";
        `);
      } catch (e) {}

      try {
        await this.dataSource.query(`
          UPDATE campaigns 
          SET "startedAt" = COALESCE("scheduledAt", "createdAt")
          WHERE "startedAt" IS NOT NULL AND "startedAt" > "updatedAt";
        `);
      } catch (e) {}

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS campaign_jobs (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "campaignId" character varying(255) NOT NULL,
          "lineUserId" character varying(50) NOT NULL,
          "status" character varying(50) NOT NULL DEFAULT 'pending',
          "errorReason" text,
          "sentAt" TIMESTAMP WITHOUT TIME ZONE,
          "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_campaign_jobs_id" PRIMARY KEY ("id")
        );
      `);

      // 🛡️ OA-WP001 Safe Additive Migration
      await this.dataSource.query(`
        ALTER TABLE customer_groups ADD COLUMN IF NOT EXISTS "botId" character varying(64);
      `);

      await this.dataSource.query(`
        ALTER TABLE customer_group_members ADD COLUMN IF NOT EXISTS "botId" character varying(64);
      `);

      await this.dataSource.query(`
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "botId" character varying(64);
      `);

      await this.dataSource.query(`
        ALTER TABLE campaign_jobs ADD COLUMN IF NOT EXISTS "botId" character varying(64);
      `);

      // 🛡️ REL-WP002 Safe Additive Job Lease Migration
      await this.dataSource.query(`
        ALTER TABLE campaign_jobs ADD COLUMN IF NOT EXISTS "leaseToken" character varying(64);
      `);

      await this.dataSource.query(`
        ALTER TABLE campaign_jobs ADD COLUMN IF NOT EXISTS "leaseOwner" character varying(128);
      `);

      await this.dataSource.query(`
        ALTER TABLE campaign_jobs ADD COLUMN IF NOT EXISTS "leaseExpiresAt" TIMESTAMP WITHOUT TIME ZONE;
      `);

      await this.dataSource.query(`
        ALTER TABLE campaign_jobs ADD COLUMN IF NOT EXISTS "leaseHeartbeatAt" TIMESTAMP WITHOUT TIME ZONE;
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS oa_runtime_state (
          "id" character varying(64) NOT NULL DEFAULT 'global',
          "activeBotId" character varying(64),
          "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_oa_runtime_state_id" PRIMARY KEY ("id")
        );
      `);

      await this.dataSource.query(`
        INSERT INTO oa_runtime_state ("id", "activeBotId")
        VALUES ('global', NULL)
        ON CONFLICT ("id") DO NOTHING;
      `);

      // 🛡️ REL-WP003-R2 Durable Send-Part Ledger Migration (ARM + CONFIRM & Legacy Migration)
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS campaign_send_parts (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "jobId" uuid NOT NULL,
          "campaignId" character varying(255) NOT NULL,
          "botId" character varying(64) NOT NULL,
          "lineUserId" character varying(50) NOT NULL,
          "partKey" character varying(50) NOT NULL DEFAULT 'text',
          "partOrder" integer NOT NULL DEFAULT 0,
          "armRequestId" character varying(128),
          "dispatchToken" character varying(128),
          "dispatchOwner" character varying(128),
          "armedAt" TIMESTAMP WITHOUT TIME ZONE,
          "dispatchedAt" TIMESTAMP WITHOUT TIME ZONE,
          "reconcileReason" character varying(255),
          "resolvedAt" TIMESTAMP WITHOUT TIME ZONE,
          "status" character varying(50) NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_campaign_send_parts_id" PRIMARY KEY ("id")
        );
      `);

      // 🛡️ R2: Drop obsolete legacy uniqueness/constraints that would block multipart inserts
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts DROP CONSTRAINT IF EXISTS "UQ_campaign_send_parts_job_partIndex";`);
      } catch (e) {}
      try {
        await this.dataSource.query(`DROP INDEX IF EXISTS "UQ_campaign_send_parts_job_partIndex";`);
      } catch (e) {}
      try {
        await this.dataSource.query(`DROP INDEX IF EXISTS "IDX_campaign_send_parts_jobId_partIndex";`);
      } catch (e) {}

      // 🛡️ R2: Add new columns if migrating from previous schema
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "partKey" character varying(50) NOT NULL DEFAULT 'text';`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "partOrder" integer NOT NULL DEFAULT 0;`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "armRequestId" character varying(128);`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "dispatchToken" character varying(128);`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "dispatchOwner" character varying(128);`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "armedAt" TIMESTAMP WITHOUT TIME ZONE;`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP WITHOUT TIME ZONE;`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "reconcileReason" character varying(255);`);
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP WITHOUT TIME ZONE;`);
      } catch (e) {}

      // 🛡️ R2: Make legacy NOT NULL columns nullable/default-safe so new entity inserts never fail
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ALTER COLUMN "partType" DROP NOT NULL;`);
      } catch (e) {}
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ALTER COLUMN "partIndex" DROP NOT NULL;`);
      } catch (e) {}
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ALTER COLUMN "totalParts" DROP NOT NULL;`);
      } catch (e) {}
      try {
        await this.dataSource.query(`ALTER TABLE campaign_send_parts ALTER COLUMN "sentAt" DROP NOT NULL;`);
      } catch (e) {}

      // 🛡️ R2: Non-data-destructive migration for legacy rows
      try {
        await this.dataSource.query(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_send_parts' AND column_name = 'partType') THEN
              UPDATE campaign_send_parts
              SET "partKey" = CASE WHEN "partType" = 'image' THEN 'image' ELSE 'text' END
              WHERE "partKey" IS NULL;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_send_parts' AND column_name = 'partIndex') THEN
              UPDATE campaign_send_parts
              SET "partOrder" = COALESCE("partOrder", "partIndex", 0)
              WHERE "partOrder" IS NULL;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_send_parts' AND column_name = 'sentAt') THEN
              UPDATE campaign_send_parts
              SET "dispatchedAt" = COALESCE("dispatchedAt", "sentAt")
              WHERE "dispatchedAt" IS NULL AND "status" = 'sent';
            END IF;
            UPDATE campaign_send_parts
            SET "status" = 'dispatched'
            WHERE "status" = 'sent';
          END $$;
        `);
      } catch (e) {}

      try {
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_customers_botId" ON customers ("botId");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_groups_botId" ON customer_groups ("botId");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_group_members_botId_groupId" ON customer_group_members ("botId", "groupId");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_campaigns_botId" ON campaigns ("botId");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_campaign_jobs_botId_status" ON campaign_jobs ("botId", "status");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "idx_campaign_jobs_bot_status_lease" ON campaign_jobs ("botId", "status", "leaseExpiresAt");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_campaign_send_parts_jobId" ON campaign_send_parts ("jobId");`);
        await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_campaign_send_parts_botId_status" ON campaign_send_parts ("botId", "status");`);
        await this.dataSource.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_campaign_send_parts_job_partKey" ON campaign_send_parts ("jobId", "partKey");`);
      } catch (e) {}

      this.logger.log('✅ Database schema verified/initialized successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to initialize database schema:', error);
    }
  }
}
