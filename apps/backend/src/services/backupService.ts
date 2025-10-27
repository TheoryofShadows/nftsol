import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const execAsync = promisify(exec);

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  s3Bucket?: string;
  s3Region?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  retentionDays: number;
}

export class BackupService {
  private config: BackupConfig;
  private s3Client?: any;

  constructor(config: BackupConfig) {
    this.config = config;
    
    // Initialize S3 client if credentials are provided
    if (config.s3Bucket && config.awsAccessKeyId && config.awsSecretAccessKey) {
      this.s3Client = new S3Client({
        region: config.s3Region || 'us-east-1',
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey
        }
      });
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<{
    success: boolean;
    backupPath?: string;
    error?: string;
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `nftsol-backup-${timestamp}.sql`;
      const backupPath = path.join(this.config.backupDir, backupFileName);

      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      // Create database dump
      const dumpCommand = `pg_dump "${this.config.databaseUrl}" > "${backupPath}"`;
      await execAsync(dumpCommand);

      // Compress the backup
      const compressedPath = `${backupPath}.gz`;
      const compressCommand = `gzip "${backupPath}"`;
      await execAsync(compressCommand);

      console.log(`✅ Database backup created: ${compressedPath}`);

      // Upload to S3 if configured
      if (this.s3Client && this.config.s3Bucket) {
        await this.uploadToS3(compressedPath, backupFileName + '.gz');
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupPath: compressedPath
      };
    } catch (error: any) {
      console.error('❌ Backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a backup of specific tables
   */
  async createTableBackup(tables: string[]): Promise<{
    success: boolean;
    backupPath?: string;
    error?: string;
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `nftsol-tables-${timestamp}.sql`;
      const backupPath = path.join(this.config.backupDir, backupFileName);

      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      // Create table-specific dump
      const tableList = tables.join(' ');
      const dumpCommand = `pg_dump "${this.config.databaseUrl}" --table=${tableList} > "${backupPath}"`;
      await execAsync(dumpCommand);

      // Compress the backup
      const compressedPath = `${backupPath}.gz`;
      const compressCommand = `gzip "${backupPath}"`;
      await execAsync(compressCommand);

      console.log(`✅ Table backup created: ${compressedPath}`);

      return {
        success: true,
        backupPath: compressedPath
      };
    } catch (error: any) {
      console.error('❌ Table backup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if backup file exists
      await fs.access(backupPath);

      // Restore database
      const restoreCommand = `psql "${this.config.databaseUrl}" < "${backupPath}"`;
      await execAsync(restoreCommand);

      console.log(`✅ Database restored from: ${backupPath}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload backup to S3
   */
  private async uploadToS3(filePath: string, key: string): Promise<void> {
    if (!this.s3Client || !this.config.s3Bucket) {
      throw new Error('S3 not configured');
    }

    const fileContent = await fs.readFile(filePath);
    
    const command = new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: `backups/${key}`,
      Body: fileContent,
      ContentType: 'application/gzip'
    });

    await this.s3Client.send(command);
    console.log(`✅ Backup uploaded to S3: s3://${this.config.s3Bucket}/backups/${key}`);
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.startsWith('nftsol-backup-') && file.endsWith('.sql.gz')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > retentionMs) {
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get backup status and list available backups
   */
  async getBackupStatus(): Promise<{
    success: boolean;
    backups?: Array<{
      name: string;
      size: number;
      created: Date;
      path: string;
    }>;
    error?: string;
  }> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const backups: Array<{
        name: string;
        size: number;
        created: Date;
        path: string;
      }> = [];

      for (const file of files) {
        if (file.startsWith('nftsol-backup-') && file.endsWith('.sql.gz')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            name: file,
            size: stats.size,
            created: stats.mtime,
            path: filePath
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created.getTime() - a.created.getTime());

      return {
        success: true,
        backups
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule automated backups
   */
  scheduleBackups(): void {
    // Daily backup at 2 AM
    const dailyBackup = () => {
      const now = new Date();
      const hours = now.getHours();
      
      if (hours === 2) {
        this.createBackup();
      }
    };

    // Check every hour
    setInterval(dailyBackup, 60 * 60 * 1000);

    // Weekly full backup on Sundays at 3 AM
    const weeklyBackup = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday
      const hours = now.getHours();
      
      if (day === 0 && hours === 3) {
        this.createBackup();
      }
    };

    setInterval(weeklyBackup, 60 * 60 * 1000);

    console.log('📅 Automated backups scheduled');
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await db.select({ count: sql<number>`count(*)` }).from(sql`information_schema.tables`);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database size and statistics
   */
  async getDatabaseStats(): Promise<{
    success: boolean;
    stats?: {
      size: string;
      tables: number;
      connections: number;
    };
    error?: string;
  }> {
    try {
      // Get database size
      const [sizeResult] = await db.select({
        size: sql<string>`pg_size_pretty(pg_database_size(current_database()))`
      }).from(sql`pg_database`);

      // Get table count
      const [tableCount] = await db.select({
        count: sql<number>`count(*)`
      }).from(sql`information_schema.tables`);

      // Get active connections
      const [connections] = await db.select({
        count: sql<number>`count(*)`
      }).from(sql`pg_stat_activity`);

      return {
        success: true,
        stats: {
          size: sizeResult.size,
          tables: tableCount.count,
          connections: connections.count
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
