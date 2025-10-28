# 📊 NFTSol Monitoring & Alerts Setup

## **🔍 Health Monitoring Configuration**

### **UptimeRobot Setup (Free Tier)**
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Create account and add new monitor
3. Configure:
   - **Monitor Type:** HTTP(s)
   - **URL:** `https://nftsol-dev.onrender.com/healthz`
   - **Check Interval:** 5 minutes
   - **Alert Contacts:** Your email/SMS

### **Advanced Monitoring (Paid)**
- **Datadog:** Full APM and infrastructure monitoring
- **New Relic:** Application performance monitoring
- **Pingdom:** Uptime and performance monitoring

## **🚨 Alert Configuration**

### **Critical Alerts (Immediate Response)**
```bash
# Health check failure
curl -s https://nftsol-dev.onrender.com/healthz | grep -q "healthy" || echo "ALERT: Health check failed"

# Database connection failure
curl -s https://nftsol-dev.onrender.com/api/programs | grep -q "success" || echo "ALERT: Database connection failed"

# Withdrawal system down
curl -s https://nftsol-dev.onrender.com/api/admin/emergency/status | grep -q "withdrawalsPaused.*false" || echo "ALERT: Withdrawal system paused"
```

### **Warning Alerts (Monitor Closely)**
```bash
# High error rate
# Check logs for error patterns

# Slow response times
# Monitor API response times > 2 seconds

# Low platform wallet balance
# Check wallet balance < 1 SOL
```

## **📈 Metrics to Track**

### **System Metrics**
- **Uptime:** Target 99.9%
- **Response Time:** Target < 200ms average
- **Error Rate:** Target < 0.1%
- **Database Connections:** Monitor pool usage

### **Business Metrics**
- **Withdrawal Volume:** Daily SOL withdrawn
- **Success Rate:** Completed vs failed withdrawals
- **Processing Time:** Average time from request to completion
- **User Activity:** Number of active users

### **Security Metrics**
- **Failed Login Attempts:** Monitor for brute force
- **Rate Limit Hits:** Track abuse attempts
- **Suspicious Activity:** Unusual withdrawal patterns
- **Admin Actions:** Track all admin operations

## **🔧 Monitoring Scripts**

### **Health Check Script**
```bash
#!/bin/bash
# health-monitor.sh

ENDPOINT="https://nftsol-dev.onrender.com/healthz"
ALERT_EMAIL="your-email@example.com"

# Check health endpoint
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$ENDPOINT")

if [ "$RESPONSE" != "200" ]; then
    echo "ALERT: Health check failed with status $RESPONSE" | mail -s "NFTSol Health Alert" "$ALERT_EMAIL"
fi
```

### **Balance Monitor Script**
```bash
#!/bin/bash
# balance-monitor.sh

PLATFORM_WALLET="YOUR_PLATFORM_WALLET_ADDRESS"
MIN_BALANCE=1.0
ALERT_EMAIL="your-email@example.com"

# Check platform wallet balance
BALANCE=$(solana balance "$PLATFORM_WALLET" --url https://api.mainnet-beta.solana.com | grep -o "[0-9.]* SOL" | cut -d" " -f1)

if (( $(echo "$BALANCE < $MIN_BALANCE" | bc -l) )); then
    echo "ALERT: Platform wallet balance is low: $BALANCE SOL" | mail -s "NFTSol Balance Alert" "$ALERT_EMAIL"
fi
```

### **Reconciliation Script**
```bash
#!/bin/bash
# reconciliation-monitor.sh

# Run daily reconciliation checks
psql "$DATABASE_URL" -f reconciliation-queries.sql > reconciliation-report.txt

# Check for issues
if grep -q "NEGATIVE_BALANCE\|PENDING_MISMATCH\|MISSING_TX_SIG" reconciliation-report.txt; then
    echo "ALERT: Reconciliation issues found" | mail -s "NFTSol Reconciliation Alert" "$ALERT_EMAIL"
fi
```

## **📊 Dashboard Setup**

### **Render Dashboard Monitoring**
1. Go to Render Dashboard → Your Service
2. Monitor:
   - **CPU Usage**
   - **Memory Usage**
   - **Response Times**
   - **Error Rates**
   - **Log Output**

### **Custom Dashboard (Optional)**
```javascript
// Simple monitoring dashboard
const express = require('express');
const app = express();

app.get('/monitor', async (req, res) => {
  const health = await checkHealth();
  const balance = await checkWalletBalance();
  const withdrawals = await getWithdrawalStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    health,
    balance,
    withdrawals,
    status: 'operational'
  });
});
```

## **🚨 Emergency Response Plan**

### **Incident Response Steps**
1. **Detect Issue** - Monitoring alerts trigger
2. **Assess Impact** - Determine severity and scope
3. **Pause System** - Use emergency controls if needed
4. **Investigate** - Check logs and system status
5. **Fix Issue** - Resolve the problem
6. **Resume Service** - Re-enable withdrawals
7. **Post-Mortem** - Document lessons learned

### **Emergency Contacts**
- **Primary Admin:** Your contact info
- **Backup Admin:** Secondary contact
- **Render Support:** support@render.com
- **Database Support:** Your DB provider support

## **📋 Monitoring Checklist**

### **Daily Checks**
- [ ] Health endpoint responding
- [ ] Database queries working
- [ ] Platform wallet balance adequate
- [ ] No critical errors in logs
- [ ] Withdrawal processing normal

### **Weekly Checks**
- [ ] Run full reconciliation queries
- [ ] Review error logs and patterns
- [ ] Check system performance metrics
- [ ] Verify backup procedures
- [ ] Test emergency controls

### **Monthly Checks**
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery testing
- [ ] Update monitoring thresholds
- [ ] Review and update documentation

## **🔧 Automated Monitoring Setup**

### **Cron Jobs**
```bash
# Add to crontab
# Health check every 5 minutes
*/5 * * * * /path/to/health-monitor.sh

# Balance check every hour
0 * * * * /path/to/balance-monitor.sh

# Daily reconciliation
0 2 * * * /path/to/reconciliation-monitor.sh
```

### **Log Monitoring**
```bash
# Monitor logs for errors
tail -f /var/log/nftsol/error.log | grep -i "error\|exception\|failed"

# Monitor withdrawal activity
tail -f /var/log/nftsol/withdrawals.log | grep -i "completed\|failed"
```

## **📊 Success Metrics**

### **Target KPIs**
- **Uptime:** 99.9%
- **Response Time:** < 200ms
- **Error Rate:** < 0.1%
- **Withdrawal Success Rate:** > 99%
- **Average Processing Time:** < 30 seconds

### **Alert Thresholds**
- **Health Check Failure:** Immediate alert
- **Response Time > 2s:** Warning alert
- **Error Rate > 1%:** Critical alert
- **Balance < 1 SOL:** Warning alert
- **Balance < 0.1 SOL:** Critical alert

## **✅ Monitoring Setup Complete**

Once configured:
- ✅ **Health monitoring** active
- ✅ **Alert system** configured
- ✅ **Metrics tracking** enabled
- ✅ **Emergency response** plan ready
- ✅ **Automated checks** scheduled
