"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageService = exports.performanceMonitoring = exports.trackAPICalls = exports.trackUsage = void 0;
const usageMonitoringService_1 = require("../services/usageMonitoringService");
const usageService = new usageMonitoringService_1.UsageMonitoringService();
exports.usageService = usageService;
// Generate demo data on startup
usageService.generateDemoData();
const trackUsage = (req, res, next) => {
    const startTime = Date.now();
    // Skip tracking for certain paths
    const skipPaths = ['/healthz', '/favicon.ico', '/robots.txt'];
    if (skipPaths.includes(req.path)) {
        return next();
    }
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        // Extract user information
        const userId = req.user?.id;
        const walletAddress = req.user?.walletAddress;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'Unknown';
        // Calculate request/response sizes
        const requestSize = req.get('content-length') ? parseInt(req.get('content-length')) : 0;
        const responseSize = res.get('content-length') ? parseInt(res.get('content-length')) : 0;
        const metrics = {
            timestamp: Date.now(),
            endpoint: req.path,
            method: req.method,
            responseTime,
            statusCode: res.statusCode,
            userId,
            walletAddress,
            ipAddress,
            userAgent,
            requestSize,
            responseSize
        };
        usageService.recordUsage(metrics);
    });
    next();
};
exports.trackUsage = trackUsage;
// Enhanced tracking for API endpoints
const trackAPICalls = (req, res, next) => {
    const startTime = Date.now();
    // Only track API calls
    if (!req.path.startsWith('/api/')) {
        return next();
    }
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        // Log API call details
        console.log(`API Call: ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);
        // Record detailed metrics
        const metrics = {
            timestamp: Date.now(),
            endpoint: req.path,
            method: req.method,
            responseTime,
            statusCode: res.statusCode,
            userId: req.user?.id,
            walletAddress: req.user?.walletAddress,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'Unknown',
            requestSize: req.get('content-length') ? parseInt(req.get('content-length')) : 0,
            responseSize: res.get('content-length') ? parseInt(res.get('content-length')) : 0
        };
        usageService.recordUsage(metrics);
    });
    next();
};
exports.trackAPICalls = trackAPICalls;
// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        // Log slow requests
        if (responseTime > 1000) {
            console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
        }
        // Log error responses
        if (res.statusCode >= 400) {
            console.error(`Error response: ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);
        }
    });
    next();
};
exports.performanceMonitoring = performanceMonitoring;
