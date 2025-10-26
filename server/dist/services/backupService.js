"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class BackupService {
    constructor(config) {
        this.config = config;
        // Initialize S3 client if credentials are provided
        if (config.s3Bucket && config.awsAccessKeyId && config.awsSecretAccessKey) {
            this.s3Client = new client_s3_1.S3Client({
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
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `nftsol-backup-${timestamp}.sql`;
            const backupPath = path_1.default.join(this.config.backupDir, backupFileName);
            // Ensure backup directory exists
            await promises_1.default.mkdir(this.config.backupDir, { recursive: true });
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
        }
        catch (error) {
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
    async createTableBackup(tables) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `nftsol-tables-${timestamp}.sql`;
            const backupPath = path_1.default.join(this.config.backupDir, backupFileName);
            // Ensure backup directory exists
            await promises_1.default.mkdir(this.config.backupDir, { recursive: true });
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
        }
        catch (error) {
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
    async restoreBackup(backupPath) {
        try {
            // Check if backup file exists
            await promises_1.default.access(backupPath);
            // Restore database
            const restoreCommand = `psql "${this.config.databaseUrl}" < "${backupPath}"`;
            await execAsync(restoreCommand);
            console.log(`✅ Database restored from: ${backupPath}`);
            return { success: true };
        }
        catch (error) {
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
    async uploadToS3(filePath, key) {
        if (!this.s3Client || !this.config.s3Bucket) {
            throw new Error('S3 not configured');
        }
        const fileContent = await promises_1.default.readFile(filePath);
        const command = new client_s3_1.PutObjectCommand({
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
    async cleanupOldBackups() {
        try {
            const files = await promises_1.default.readdir(this.config.backupDir);
            const now = Date.now();
            const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
            for (const file of files) {
                if (file.startsWith('nftsol-backup-') && file.endsWith('.sql.gz')) {
                    const filePath = path_1.default.join(this.config.backupDir, file);
                    const stats = await promises_1.default.stat(filePath);
                    if (now - stats.mtime.getTime() > retentionMs) {
                        await promises_1.default.unlink(filePath);
                        console.log(`🗑️ Deleted old backup: ${file}`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
    /**
     * Get backup status and list available backups
     */
    async getBackupStatus() {
        try {
            const files = await promises_1.default.readdir(this.config.backupDir);
            const backups = [];
            for (const file of files) {
                if (file.startsWith('nftsol-backup-') && file.endsWith('.sql.gz')) {
                    const filePath = path_1.default.join(this.config.backupDir, file);
                    const stats = await promises_1.default.stat(filePath);
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Schedule automated backups
     */
    scheduleBackups() {
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
    async testConnection() {
        try {
            await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from((0, drizzle_orm_1.sql) `information_schema.tables`);
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    /**
     * Get database size and statistics
     */
    async getDatabaseStats() {
        try {
            // Get database size
            const [sizeResult] = await db_1.db.select({
                size: (0, drizzle_orm_1.sql) `pg_size_pretty(pg_database_size(current_database()))`
            }).from((0, drizzle_orm_1.sql) `pg_database`);
            // Get table count
            const [tableCount] = await db_1.db.select({
                count: (0, drizzle_orm_1.sql) `count(*)`
            }).from((0, drizzle_orm_1.sql) `information_schema.tables`);
            // Get active connections
            const [connections] = await db_1.db.select({
                count: (0, drizzle_orm_1.sql) `count(*)`
            }).from((0, drizzle_orm_1.sql) `pg_stat_activity`);
            return {
                success: true,
                stats: {
                    size: sizeResult.size,
                    tables: tableCount.count,
                    connections: connections.count
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
exports.BackupService = BackupService;
