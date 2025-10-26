"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web3_js_1 = require("@solana/web3.js");
const environment_1 = require("../config/environment");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// Enhanced health check endpoint
router.get("/", async (_req, res) => {
    try {
        const health = {
            ok: true,
            timestamp: Date.now(),
            service: "nftsol-server",
            version: "1.0.0",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development'
        };
        res.json(health);
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Health check failed',
            timestamp: Date.now()
        });
    }
});
// Comprehensive system health check
router.get("/detailed", async (_req, res) => {
    try {
        const heliusConfig = (0, environment_1.getHeliusConfig)();
        const connection = new web3_js_1.Connection(heliusConfig.rpcUrl, 'confirmed');
        const health = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            services: {
                database: await testDatabase(),
                helius: await testHelius(connection),
                ipfs: await testIPFS(),
                clout: await testCloutToken(connection)
            },
            performance: {
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
                cpuUsage: process.cpuUsage()
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasOpenAI: !!process.env.OPENAI_API_KEY,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasHeliusKey: !!process.env.HELIUS_API_KEY
            }
        };
        res.json(health);
    }
    catch (error) {
        res.status(500).json({
            timestamp: new Date().toISOString(),
            status: 'error',
            error: error instanceof Error ? error.message : 'System health check failed'
        });
    }
});
// Test database connection
async function testDatabase() {
    try {
        // Use the dedicated health check function
        const health = await (0, db_1.checkDatabaseHealth)();
        if (health.healthy) {
            return { status: 'healthy', connected: true };
        }
        else {
            return {
                status: 'error',
                connected: false,
                error: health.error || 'Database connection failed'
            };
        }
    }
    catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error instanceof Error ? error.message : 'Database connection failed'
        };
    }
}
// Test Helius connection
async function testHelius(connection) {
    try {
        const slot = await connection.getSlot();
        return {
            status: 'healthy',
            connected: true,
            currentSlot: slot
        };
    }
    catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error instanceof Error ? error.message : 'Helius connection failed'
        };
    }
}
// Test IPFS connectivity
async function testIPFS() {
    try {
        const testUrl = 'https://w3s.link/ipfs/bafybeiefy2i5yfzkctg5of57nmdxkr7ilt5soyvcyoe7fa3fhsk3scodcy';
        const response = await fetch(testUrl, { method: 'HEAD' });
        return {
            status: response.ok ? 'healthy' : 'error',
            connected: response.ok,
            gateway: 'w3s.link'
        };
    }
    catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error instanceof Error ? error.message : 'IPFS connection failed'
        };
    }
}
// Test CLOUT token system
async function testCloutToken(connection) {
    try {
        const cloutMint = '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf';
        const accountInfo = await connection.getAccountInfo(new (await Promise.resolve().then(() => __importStar(require('@solana/web3.js')))).PublicKey(cloutMint));
        return {
            status: accountInfo ? 'healthy' : 'error',
            connected: !!accountInfo,
            mint: cloutMint
        };
    }
    catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error instanceof Error ? error.message : 'CLOUT token check failed'
        };
    }
}
// Additional health endpoint for Render health checks
router.get("/health", (_req, res) => res.json({
    status: "ok",
    timestamp: Date.now(),
    service: "nftsol-server",
    version: "1.0.0"
}));
exports.default = router;
