# Uptime Monitoring - Quick Start Guide

**Goal**: Get monitoring running in 30 minutes

---

## 5-Minute Setup

### Step 1: Start Services

```bash
cd ~/nftsol

# Start the monitoring stack
docker-compose -f docker-compose.uptime.yml up -d

# Verify all services are running
docker-compose -f docker-compose.uptime.yml ps
```

Expected output:
```
NAME                         STATUS      PORTS
nftsol-uptime-kuma          Up 2m       0.0.0.0:3001->3001/tcp
nftsol-status-page          Up 2m       0.0.0.0:3000->3000/tcp
nftsol-alertmanager         Up 2m       0.0.0.0:9093->9093/tcp
nftsol-webhook-receiver     Up 2m       0.0.0.0:9095->3000/tcp
nftsol-redis-monitoring     Up 2m       6380/tcp
nftsol-postgres-monitoring  Up 2m       0.0.0.0:5433->5432/tcp
nftsol-monitoring-nginx     Up 2m       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 2: Access Uptime Kuma

Open http://localhost:3001 in your browser

**Initial Setup:**
1. Set admin username (e.g., `admin`)
2. Set admin password (something secure)
3. Save settings
4. Login with credentials

### Step 3: Configure Health Check Endpoint

First, ensure your backend has the health endpoint running:

```bash
# In another terminal, verify the health endpoint
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-18T14:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "responseTime": 25 },
    "redis": { "status": "ok", "responseTime": 5 },
    "solana": { "status": "ok", "responseTime": 250 }
  }
}
```

### Step 4: Add First Monitor

In Uptime Kuma UI:

1. Click **"+ Add Monitor"**
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: "Backend API Health"
   - **URL**: `http://localhost:3001/health`
   - **Method**: GET
   - **Heartbeat Interval**: 30 seconds
   - **Timeout**: 5 seconds
   - **Retries**: 0
   - **Expected Status Code**: 200
   - **Ignore TLS Error**: Unchecked (unless self-signed cert)
3. Click **"Save"**

Wait ~60 seconds for the first check to complete.

### Step 5: Add More Monitors

Repeat Step 4 for each service:

| Service | Type | URL | Interval |
|---------|------|-----|----------|
| Frontend | HTTP | https://nftsolmarket.netlify.app | 60s |
| Backend | HTTP | https://nftsol.onrender.com/health | 30s |
| Database | TCP | postgres:5432 | 30s |
| Redis | TCP | redis:6379 | 30s |

---

## 10-Minute Alert Setup

### Slack Integration

1. **Create Slack Webhook**:
   - Go to https://api.slack.com/apps
   - Click **"Create New App"** → **"From scratch"**
   - App name: "NFTSol Monitoring"
   - Workspace: Your workspace
   - Click **"Create App"**
   - Left sidebar → **"Incoming Webhooks"**
   - Toggle **"Activate Incoming Webhooks"** to ON
   - Click **"Add New Webhook to Workspace"**
   - Select channel (e.g., #alerts)
   - Click **"Allow"**
   - Copy the **Webhook URL**

2. **Add to Uptime Kuma**:
   - Click **Settings** (top right) → **Notifications**
   - Click **"Add Notification"**
   - **Type**: Slack
   - **Notification Name**: "Slack Alerts"
   - **Webhook URL**: Paste the webhook URL
   - **Display Name**: NFTSol Monitoring
   - Click **"Test"** (you should see a test message in Slack)
   - Click **"Save"**

3. **Connect to Monitors**:
   - For each monitor, click **Edit**
   - Scroll to **"Notifications"**
   - Check **"Slack Alerts"**
   - Click **"Save"**

### Email Integration (Optional)

1. **In Uptime Kuma**:
   - Settings → Notifications
   - Click **"Add Notification"**
   - **Type**: Email
   - **Notification Name**: "Team Email"
   - **SMTP Host**: `smtp.gmail.com` (or your mail server)
   - **SMTP Port**: 587
   - **Secure (TLS)**: Checked
   - **From**: your-email@gmail.com
   - **To**: dev-team@nftsol.io
   - **Username**: your-email@gmail.com
   - **Password**: [app-specific password, not regular password]
   - Click **"Test"** (check your inbox)
   - Click **"Save"**

2. **Connect to Monitors**:
   - Edit each monitor
   - Enable "Team Email" notification
   - Save

---

## 15-Minute Status Page

### Create Status Page

1. **In Uptime Kuma**:
   - Click **"Status Pages"** (top menu)
   - Click **"Create Status Page"**
   - Configure:
     - **Slug**: `status` (becomes: http://localhost/status)
     - **Page Title**: "NFTSol Status"
     - **Description**: "Real-time service status and incident history"
     - **Theme**: Dark (or Light)
     - **Published**: Checked
   - Click **"Create"**

2. **Add Monitors to Status Page**:
   - In the newly created status page
   - Click **"Edit Group"**
   - Create group: "Platform Services"
   - Click **"Add Monitors to Group"**
   - Select monitors (Backend API, Frontend, etc.)
   - Click **"Save"**

3. **Customize Appearance**:
   - Click **"Edit"** on the status page
   - Upload logo (optional)
   - Add custom CSS (optional)
   - Set password (optional, for editing)
   - Click **"Save"**

4. **Share Status Page**:
   - Public URL: `http://localhost/status` (or your domain)
   - Share with users/team
   - Post in README.md: `Status: [NFTSol Status Page](https://status.nftsol.io)`

---

## 20-Minute Webhook Integration

### Configure Webhook Receiver

The webhook receiver is already running at http://localhost:9095

**Test it:**

```bash
curl -X POST http://localhost:9095/alert \
  -H "Content-Type: application/json" \
  -d '{
    "monitor": "Test Monitor",
    "status": "down",
    "severity": "critical",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "message": "Test alert from curl"
  }'

# Expected response:
{
  "success": true,
  "message": "Alert queued for processing",
  "alertId": "Test Monitor-1234567890"
}
```

### Connect Uptime Kuma to Webhook Receiver

1. **In Uptime Kuma**:
   - Settings → Notifications
   - Click **"Add Notification"**
   - **Type**: Webhook
   - **Notification Name**: "NFTSol Webhook"
   - **URL**: `http://webhook-receiver:3000/alert`
   - **Method**: POST
   - **Content Type**: JSON
   - **Body**:
     ```json
     {
       "monitor": "{{ monitorName }}",
       "status": "{{ status }}",
       "severity": "{{ severity }}",
       "timestamp": "{{ dateTime }}",
       "message": "{{ monitorName }} is {{ status }}"
     }
     ```
   - Click **"Test"** (you should see the alert in webhook receiver logs)
   - Click **"Save"**

2. **Enable on Monitors**:
   - Edit each monitor
   - Enable "NFTSol Webhook" notification
   - Save

### View Alerts

```bash
# Get recent alerts
curl http://localhost:9095/alerts/recent?limit=10

# Get incident history
curl http://localhost:9095/incidents

# Acknowledge incident
curl -X POST http://localhost:9095/incidents/Backend%20API/acknowledge

# Resolve incident
curl -X POST http://localhost:9095/incidents/Backend%20API/resolve
```

---

## Verification Checklist

- [ ] All services running: `docker-compose -f docker-compose.uptime.yml ps`
- [ ] Uptime Kuma accessible: http://localhost:3001
- [ ] Status page accessible: http://localhost:3000
- [ ] At least 3 monitors configured
- [ ] Slack notification tested
- [ ] Email notification tested (if configured)
- [ ] Webhook receiver responding: `curl http://localhost:9095/health`
- [ ] Monitors show status (green or red dots)
- [ ] Test alert sent (manually trigger in Uptime Kuma)
- [ ] Alert received in Slack
- [ ] Incident appears in status page

---

## Common First-Time Issues

### "Monitor is always DOWN"

**Problem**: Monitor keeps failing even though service is up

**Solutions**:
1. Check URL is correct: `curl http://localhost:3001/health`
2. Increase timeout: Edit monitor → Timeout: 10 (was 5)
3. Check expected status: Should be 200
4. Check TLS/SSL: If https, might need "Ignore TLS Error"

### "No alerts appearing"

**Problem**: Service goes down but notifications don't send

**Solutions**:
1. Test notification: Settings → Notifications → Test
2. Check monitor config: Edit monitor → Notification should be enabled
3. Check Slack webhook: Still valid?
4. Check webhook logs: `docker logs nftsol-webhook-receiver`

### "Status page shows all green even when service is down"

**Problem**: Status page not updating

**Solutions**:
1. Refresh browser (hard refresh: Ctrl+Shift+R)
2. Check monitors are saved to status page
3. Check monitor status in Uptime Kuma dashboard
4. Restart status page: `docker-compose -f docker-compose.uptime.yml restart status-page`

---

## Next Steps

1. ✅ Get services running
2. ✅ Add monitors
3. ✅ Configure alerts
4. ✅ Create status page
5. 📋 Configure custom domain (status.nftsol.io)
6. 📋 Set up Prometheus scraping
7. 📋 Create incident response runbook
8. 📋 Schedule incident response drills

---

## Important Commands

```bash
# View logs
docker-compose -f docker-compose.uptime.yml logs -f

# Restart specific service
docker-compose -f docker-compose.uptime.yml restart uptime-kuma

# Stop everything
docker-compose -f docker-compose.uptime.yml down

# Stop and remove data
docker-compose -f docker-compose.uptime.yml down -v

# Backup Uptime Kuma data
docker cp nftsol-uptime-kuma:/app/data ./backup-uptime-kuma-$(date +%Y%m%d)

# View webhook receiver logs
docker logs -f nftsol-webhook-receiver

# Test webhook endpoint
curl -v http://localhost:9095/health
```

---

## Support

- **Uptime Kuma Docs**: https://uptime.kuma.pet/
- **Docker Issues**: `docker logs <container_name>`
- **Check Services**: `docker ps -a`

**That's it! You now have enterprise-grade uptime monitoring. 🎉**
