
import { Request, Response } from 'express';

interface SecurityEvent {
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_auth' | 'sql_injection_attempt' | 'file_upload_violation';
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private alertThresholds = {
    suspicious_activity: 10,
    rate_limit_exceeded: 20,
    invalid_auth: 5,
    sql_injection_attempt: 1,
    file_upload_violation: 3
  };

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Check for alerts
    this.checkAlerts(event.type, event.ip);
    
    // Log to console based on severity (reduce noise in development)
    if (process.env.NODE_ENV === 'development' && event.severity === 'low') {
      return; // Skip low severity logs in development
    }
    
    const logLevel = event.severity === 'critical' ? 'error' : 'warn';
    console[logLevel](`[SECURITY-${event.severity.toUpperCase()}] ${event.type} from ${event.ip}:`, event.details);
  }

  private checkAlerts(type: SecurityEvent['type'], ip: string) {
    const recentEvents = this.events.filter(
      e => e.type === type && 
           e.ip === ip && 
           Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const threshold = this.alertThresholds[type];
    if (recentEvents.length >= threshold) {
      this.triggerAlert(type, ip, recentEvents.length);
    }
  }

  private triggerAlert(type: string, ip: string, count: number) {
    console.error(`🚨 SECURITY ALERT: ${count} ${type} events from IP ${ip} in the last hour`);
    
    // In production, you could:
    // - Send email alerts
    // - Integrate with Slack/Discord
    // - Temporarily block the IP
    // - Send to external monitoring service
  }

  getSecurityReport() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(e => e.timestamp > hourAgo);
    const dailyEvents = this.events.filter(e => e.timestamp > dayAgo);

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIPs = recentEvents.reduce((acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalEventsLastHour: recentEvents.length,
        totalEventsLast24Hours: dailyEvents.length,
        criticalEventsLastHour: recentEvents.filter(e => e.severity === 'critical').length
      },
      eventsByType,
      topSuspiciousIPs: Object.entries(topIPs)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      recentCriticalEvents: recentEvents
        .filter(e => e.severity === 'critical')
        .slice(-10)
        .map(e => ({
          type: e.type,
          ip: e.ip,
          timestamp: e.timestamp,
          details: e.details
        }))
    };
  }

  // Middleware to log security events
  createEventLogger(type: SecurityEvent['type'], severity: SecurityEvent['severity'] = 'medium') {
    return (req: Request, res: Response, details: any = {}) => {
      this.logEvent({
        type,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        severity,
        details: {
          url: req.url,
          method: req.method,
          ...details
        }
      });
    };
  }
}

export const securityMonitor = new SecurityMonitor();

// Express middleware for automatic security logging
export const securityLogger = (req: Request, res: Response, next: Function) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /<script|javascript:/gi, // XSS attempts
    /union\s+select/gi, // SQL injection
    /exec\s*\(/gi, // Command injection
  ];

  const url = req.url.toLowerCase();
  const body = JSON.stringify(req.body).toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      securityMonitor.logEvent({
        type: 'suspicious_activity',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        severity: 'high',
        details: {
          url: req.url,
          method: req.method,
          pattern: pattern.toString(),
          body: req.body
        }
      });
      break;
    }
  }

  next();
};

// Security dashboard endpoint
export const getSecurityDashboard = (req: Request, res: Response) => {
  const report = securityMonitor.getSecurityReport();
  
  res.json({
    status: 'secure',
    timestamp: new Date().toISOString(),
    platform: 'NFTSol',
    report
  });
};
