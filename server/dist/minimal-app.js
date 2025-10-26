"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const environment_1 = require("./config/environment");
const appConfig = (0, environment_1.getAppConfig)();
const app = (0, express_1.default)();
// Trust proxy for rate limiting and security
app.set('trust proxy', 1);
// Basic middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Logging
if (process.env.NODE_ENV === 'production') {
    app.use((0, morgan_1.default)('combined'));
}
else {
    app.use((0, morgan_1.default)('dev'));
}
// Simple health check
app.get('/healthz', (_req, res) => {
    res.json({
        status: "ok",
        timestamp: Date.now(),
        service: "nftsol-server",
        version: "1.0.0",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get('/health', (_req, res) => {
    res.json({
        status: "ok",
        timestamp: Date.now(),
        service: "nftsol-server",
        version: "1.0.0"
    });
});
// Basic API routes
app.get('/api/status', (_req, res) => {
    res.json({
        message: "NFTSol API is running",
        timestamp: Date.now(),
        environment: process.env.NODE_ENV
    });
});
// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: Date.now()
    });
});
// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({
        error: 'Not found',
        timestamp: Date.now()
    });
});
exports.default = app;
