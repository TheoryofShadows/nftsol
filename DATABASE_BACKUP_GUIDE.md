# NFTSol Database Backup & Recovery Guide

**Document Status**: Complete
**Last Updated**: November 18, 2025
**Criticality**: 🔴 CRITICAL - DATA PROTECTION

---

## Quick Start

### Enable Automated Backups (5 minutes)
```bash
# 1. Install backup script
chmod +x scripts/backup.sh
chmod +x scripts/backup-cron-setup.sh
chmod +x scripts/restore-backup.sh
chmod +x scripts/verify-backup.sh

# 2. Setup automated backups (requires sudo)
sudo ./scripts/backup-cron-setup.sh

# 3. Configure credentials
sudo nano /etc/nftsol-backup.env

# 4. Test backup
./scripts/backup.sh

# 5. Verify restoration works
./scripts/verify-backup.sh /var/backups/nftsol/
```

### Restore From Backup
```bash
# List available backups
ls -lah /var/backups/nftsol/

# Restore to test database (safe)
./scripts/restore-backup.sh /var/backups/nftsol/nftsol_db_20251118_120000.sql.gz nftsol_test

# Restore to production (dangerous!)
./scripts/restore-backup.sh /var/backups/nftsol/nftsol_db_20251118_120000.sql.gz nftsol
```

---

## Backup System Overview

### Architecture
```
Application
    ↓
Database (PostgreSQL)
    ↓
Local Backup (pg_dump + gzip)
    ↓
Local Storage (/var/backups/nftsol/)
    ↓
S3 Cloud Storage (AWS, GCS, MinIO)
    ↓
Archive Storage (30-day retention)
```

### Key Metrics
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 6 hours
- **Frequency**: Every 6 hours + daily at 2 AM
- **Retention**: 7 days local, 30 days archive
- **Compression**: GZIP (typically 70-90% reduction)
- **Verification**: Monthly test restoration

---

## Scripts Overview

### 1. `backup.sh` (Main Backup Script)
**Purpose**: Create compressed database backups

**Features**:
- Automatic PostgreSQL dump with gzip compression
- S3 cloud upload (optional)
- Backup rotation (automatic cleanup)
- Verification logging
- Slack notifications
- Error handling and alerts

**Configuration** (via `/etc/nftsol-backup.env`):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nftsol
DB_USER=postgres
DB_PASSWORD=<your_password>

# S3 (optional)
S3_BACKUP_BUCKET=nftsol-backups
S3_BACKUP_REGION=us-east-1
AWS_BACKUP_KEY=<key>
AWS_BACKUP_SECRET=<secret>

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Execution**:
```bash
# Manual backup
./scripts/backup.sh

# Via cron (automatic)
# 0 2 * * * /usr/local/bin/nftsol-backup.sh  (daily at 2 AM)
# 0 */6 * * * /usr/local/bin/nftsol-backup.sh  (every 6 hours)

# Via systemd timer (modern approach)
systemctl status nftsol-backup.timer
systemctl list-timers
```

**Output Example**:
```
[2025-11-18 14:30:15] Starting database backup...
[2025-11-18 14:30:15] Database: nftsol on localhost:5432
[2025-11-18 14:30:45] Backup created successfully (Size: 245.3 MB)
[2025-11-18 14:30:45] Backup archived to /var/backups/nftsol/archive/...
[2025-11-18 14:31:00] Uploading to S3: s3://nftsol-backups/backups/
[2025-11-18 14:31:30] S3 upload successful
[2025-11-18 14:31:30] Cleaning up old backups (keeping last 7 days)...
[2025-11-18 14:31:31] Backup process completed successfully
```

### 2. `restore-backup.sh` (Restore Script)
**Purpose**: Restore database from backup

**Features**:
- Safe restore with confirmation
- Automatic database creation
- Table verification
- Detailed logging
- Supports both production and test restores

**Usage**:
```bash
# Restore to new test database (recommended first step)
./restore-backup.sh /backups/nftsol_db_20251118_120000.sql.gz nftsol_test

# Restore to production (requires explicit confirmation)
./restore-backup.sh /backups/nftsol_db_20251118_120000.sql.gz nftsol
```

**Process**:
1. Validates backup file exists and is gzipped
2. Confirms target database
3. Creates database (if needed)
4. Decompresses and restores from backup
5. Verifies table count and structure
6. Shows sample of restored tables

### 3. `verify-backup.sh` (Verification Script)
**Purpose**: Test backup integrity and restoration

**Features**:
- Gzip integrity check
- Test restoration to isolated database
- Data integrity verification
- Table and constraint validation
- Query execution testing
- Automatic cleanup
- Detailed reporting

**Usage**:
```bash
# Verify latest backup
./verify-backup.sh /var/backups/nftsol/

# Verify specific backup
./verify-backup.sh /var/backups/nftsol/nftsol_db_20251118_120000.sql.gz

# Output: Creates backup-verification-TIMESTAMP.log
```

**Test Checks**:
- Gzip file integrity
- Backup file size validation
- Test database restoration
- Table count verification
- Critical tables present (nfts, users, nft_listings, nft_sales)
- Foreign key constraints preserved
- Query execution on restored data

### 4. `backup-cron-setup.sh` (Installation Script)
**Purpose**: Install and configure automated backups

**Features**:
- Creates backup directories
- Installs backup script to system
- Creates cron job
- Sets up logrotate
- Creates systemd timer
- Generates configuration file

**Usage** (requires root):
```bash
sudo ./scripts/backup-cron-setup.sh
```

**Installation Steps**:
1. Creates `/var/backups/nftsol/` and `/var/backups/nftsol/archive/`
2. Copies `backup.sh` to `/usr/local/bin/nftsol-backup.sh`
3. Creates logrotate configuration
4. Adds cron job: `0 2 * * * /usr/local/bin/nftsol-backup.sh`
5. Creates systemd timer with weekly schedule
6. Generates `/etc/nftsol-backup.env`

---

## Backup Schedule

### Default Schedule
```
Frequency: Every 6 hours + Daily
Times:
  - 2:00 AM (primary daily)
  - 8:00 AM
  - 2:00 PM
  - 8:00 PM

Cron Expression:
  0 2,8,14,20 * * * /usr/local/bin/nftsol-backup.sh
```

### Retention Policy
```
Local Backups:     7 days (automatic cleanup)
Archive Backups:   30 days (manual management)
S3 Backups:        Indefinite (cost optimization via lifecycle rules)
```

### Custom Schedule
Edit cron:
```bash
sudo crontab -e

# Example: Backup every 2 hours
0 */2 * * * /usr/local/bin/nftsol-backup.sh

# Example: Backup every 4 hours
0 */4 * * * /usr/local/bin/nftsol-backup.sh
```

Edit systemd timer:
```bash
sudo systemctl edit nftsol-backup.timer

# Add or modify OnCalendar section
[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
```

---

## S3 Cloud Storage Setup

### AWS S3 Setup
```bash
# 1. Create S3 bucket
aws s3 mb s3://nftsol-backups --region us-east-1

# 2. Enable versioning (keeps backup history)
aws s3api put-bucket-versioning \
  --bucket nftsol-backups \
  --versioning-configuration Status=Enabled

# 3. Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket nftsol-backups \
  --server-side-encryption-configuration '
  {
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# 4. Setup lifecycle policy (delete old backups)
aws s3api put-bucket-lifecycle-configuration \
  --bucket nftsol-backups \
  --lifecycle-configuration file://lifecycle.json
```

**lifecycle.json**:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Prefix": "backups/",
      "Expiration": {
        "Days": 90
      }
    },
    {
      "Id": "ArchiveOldVersions",
      "Status": "Enabled",
      "Prefix": "backups/",
      "NoncurrentVersionTransition": {
        "NoncurrentDays": 30,
        "StorageClass": "GLACIER"
      }
    }
  ]
}
```

### Create IAM User for Backups
```bash
# 1. Create user
aws iam create-user --user-name nftsol-backup

# 2. Create access key
aws iam create-access-key --user-name nftsol-backup

# 3. Create inline policy
aws iam put-user-policy --user-name nftsol-backup \
  --policy-name nftsol-backup-s3 \
  --policy-document file://backup-policy.json
```

**backup-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nftsol-backups",
        "arn:aws:s3:::nftsol-backups/*"
      ]
    }
  ]
}
```

### Google Cloud Storage Setup
```bash
# 1. Create bucket
gsutil mb gs://nftsol-backups

# 2. Enable versioning
gsutil versioning set on gs://nftsol-backups

# 3. Setup lifecycle
cat > lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://nftsol-backups
```

---

## Disaster Recovery Procedure

### Scenario 1: Minor Data Corruption
**Time to Recover**: 5-10 minutes

```bash
# 1. Identify backup point
ls -lah /var/backups/nftsol/

# 2. Create backup of current state (safe!)
pg_dump nftsol | gzip > /tmp/nftsol_corrupted_$(date +%s).sql.gz

# 3. Drop corrupted table
psql nftsol -c "DROP TABLE IF EXISTS corrupted_table;"

# 4. Restore from recent backup
./scripts/restore-backup.sh /var/backups/nftsol/nftsol_db_20251118_120000.sql.gz nftsol_temp

# 5. Copy table from restored backup
pg_dump -t corrupted_table nftsol_temp | psql nftsol

# 6. Cleanup
dropdb nftsol_temp
```

### Scenario 2: Full Database Corruption
**Time to Recover**: 15-30 minutes

```bash
# 1. Stop application
systemctl stop nftsol-backend

# 2. Verify backup integrity
./scripts/verify-backup.sh /var/backups/nftsol/

# 3. Rename current database (keep as evidence)
psql -c "ALTER DATABASE nftsol RENAME TO nftsol_corrupted_$(date +%s);"

# 4. Restore from backup
./scripts/restore-backup.sh /var/backups/nftsol/nftsol_db_20251118_120000.sql.gz nftsol

# 5. Verify restoration
psql nftsol -c "SELECT COUNT(*) as nft_count FROM nfts;"
psql nftsol -c "SELECT COUNT(*) as user_count FROM users;"

# 6. Restart application
systemctl start nftsol-backend

# 7. Monitor
tail -f /var/log/nftsol/backend.log
```

### Scenario 3: Complete System Failure
**Time to Recover**: 30-60 minutes

```bash
# 1. Provision new server with identical config

# 2. Install PostgreSQL
apt-get update
apt-get install -y postgresql-16

# 3. Download backup from S3
aws s3 cp s3://nftsol-backups/backups/nftsol_db_LATEST.sql.gz /tmp/

# 4. Restore database
gunzip -c /tmp/nftsol_db_LATEST.sql.gz | psql

# 5. Verify integrity
./scripts/verify-backup.sh /tmp/nftsol_db_LATEST.sql.gz

# 6. Deploy application
git clone <repo>
npm install
npm run build
npm start
```

---

## Monitoring & Alerts

### Check Backup Status
```bash
# View last backup
ls -lah /var/backups/nftsol/ | tail -5

# View backup log
tail -50 /var/log/nftsol-backup.log

# Check cron execution
grep nftsol-backup /var/log/syslog

# Check systemd timer
systemctl status nftsol-backup.timer
journalctl -u nftsol-backup.service -n 50
```

### Set Up Slack Notifications
```bash
# 1. Create Slack webhook
# Go to: https://api.slack.com/messaging/webhooks
# Copy webhook URL

# 2. Add to environment
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  | sudo tee -a /etc/nftsol-backup.env

# 3. Test notification
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test backup notification"}'
```

### Email Alerts
```bash
# 1. Configure ssmtp
sudo apt-get install ssmtp

# 2. Edit config
sudo nano /etc/ssmtp/ssmtp.conf

# 3. Add to backup script
if [ $exit_status -ne 0 ]; then
  echo "Backup failed at $(date)" | \
    mail -s "NFTSol Backup Alert" admin@nftsol.com
fi
```

### CloudWatch Monitoring (AWS)
```bash
# Create custom metric
aws cloudwatch put-metric-data \
  --namespace NFTSol \
  --metric-name BackupSuccess \
  --value 1 \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S)
```

---

## Testing & Validation

### Monthly Validation Schedule
```bash
# First Monday of each month
0 3 1-7 * 1 /path/to/verify-backup.sh /var/backups/nftsol/

# Create reminder
echo "0 9 1 * * (date; echo 'Monthly backup verification') | mail -s 'Backup Validation' admin@nftsol.com" | crontab -
```

### Test Restoration Checklist
- [ ] Restore to test database
- [ ] Verify table count matches production
- [ ] Check for data integrity
- [ ] Query test data to ensure correctness
- [ ] Cleanup test database
- [ ] Document results
- [ ] Update runbooks if needed

---

## Troubleshooting

### Problem: Backup file is very small
**Solution**:
```bash
# Check if database has data
psql nftsol -c "SELECT COUNT(*) FROM nfts; SELECT COUNT(*) FROM users;"

# Check backup compression
gunzip -c backup.sql.gz | wc -l  # Should have many lines

# Increase database logging
psql nftsol -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
systemctl reload postgresql
```

### Problem: S3 upload fails
**Solution**:
```bash
# Check AWS credentials
aws s3 ls s3://nftsol-backups/

# Check IAM permissions
aws iam get-user-policy --user-name nftsol-backup --policy-name nftsol-backup-s3

# Test upload manually
aws s3 cp /var/backups/nftsol/nftsol_db_latest.sql.gz s3://nftsol-backups/backups/
```

### Problem: Restoration fails
**Solution**:
```bash
# Check backup integrity
gunzip -t backup.sql.gz

# Check PostgreSQL version compatibility
psql --version

# Try restore with verbose output
gunzip -c backup.sql.gz | psql -d nftsol -v ON_ERROR_STOP=on 2>&1 | head -100
```

### Problem: Out of disk space
**Solution**:
```bash
# Check disk usage
df -h /var/backups/

# Reduce retention
# Edit backup.sh and change LOCAL_RETENTION_DAYS=3

# Archive old backups to cold storage
aws s3 cp /var/backups/nftsol/archive/ s3://nftsol-backups-archive/ --recursive
```

---

## Best Practices

### ✅ DO
- [ ] Test restoration monthly
- [ ] Verify backup file integrity
- [ ] Monitor backup logs
- [ ] Keep backups in multiple locations
- [ ] Document your procedures
- [ ] Setup alerts
- [ ] Calculate and document RTO/RPO
- [ ] Include backups in DR planning

### ❌ DON'T
- [ ] Ignore backup failures
- [ ] Store backups only locally
- [ ] Forget to test restoration
- [ ] Use production password in git
- [ ] Ignore backup logs
- [ ] Skip backup verification
- [ ] Delete backups manually
- [ ] Mix backup strategies

---

## Cost Optimization

### S3 Storage Costs (Example)
```
Current: 10 GB backups × 4 backups/day × $0.023/GB/month
         = ~$28/month for local backups

Optimized with Glacier:
- Active (30 days): $0.023/GB = $7/month
- Archive (90+ days): $0.004/GB = $1.20/month
- Estimated: $8/month

Savings: 72% reduction
```

### Lifecycle Rule Setup
```bash
# Transition to Glacier after 30 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket nftsol-backups \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "ArchiveOldBackups",
      "Status": "Enabled",
      "Transitions": [{
        "Days": 30,
        "StorageClass": "GLACIER"
      }],
      "Expiration": {
        "Days": 365
      }
    }]
  }'
```

---

## Compliance & Audit

### Backup Logging
All backups logged to `/var/log/nftsol-backup.log` with:
- Timestamp
- Database statistics
- File size
- S3 upload status
- Errors/warnings
- Slack notifications

### Retention Verification
```bash
# Audit backup retention
find /var/backups/nftsol/ -type f -name "nftsol_db_*.sql.gz" | wc -l

# List backups by date
ls -lah /var/backups/nftsol/ | awk '{print $6, $7, $8, $9}'
```

### Encryption Verification
```bash
# Check S3 encryption
aws s3api get-bucket-encryption --bucket nftsol-backups

# Enable encryption for backups
openssl enc -aes-256-cbc -salt -in backup.sql.gz -out backup.sql.gz.enc
```

---

## Support & Escalation

### Critical Issues
- **Backup failures**: Page on-call immediately
- **Restoration failures**: Stop application, engage DBA
- **Data corruption**: Assess backup point, engage team
- **Disk space**: Free space immediately, review retention

### Contact
- DBA On-Call: `dba-oncall@nftsol.com`
- DevOps Team: `devops@nftsol.com`
- Emergency: PagerDuty #oncall-escalation

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: DevOps Team
