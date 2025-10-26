"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.logEnvironmentStatus = logEnvironmentStatus;
exports.validateEnvironmentAndExit = validateEnvironmentAndExit;
const environment_1 = require("../config/environment");
function validateEnvironment() {
    const missing = [];
    const warnings = [];
    const securityIssues = [];
    // Required environment variables
    const required = [
        'NODE_ENV',
        'SESSION_SECRET'
    ];
    // Production-specific required variables
    const productionRequired = [
        'JWT_SECRET',
        'HELIUS_API_KEY',
        'PINATA_API_KEY',
        'PINATA_SECRET_KEY'
    ];
    // Optional but recommended
    const recommended = [
        'DATABASE_URL',
        'REDIS_URL',
        'OPENAI_API_KEY'
    ];
    // Check required variables
    for (const envVar of required) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }
    // Check production-specific requirements
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        for (const envVar of productionRequired) {
            if (!process.env[envVar]) {
                missing.push(`${envVar} (required in production)`);
            }
        }
    }
    // Check recommended variables
    for (const envVar of recommended) {
        if (!process.env[envVar]) {
            warnings.push(`${envVar} is not set - some features may be limited`);
        }
    }
    // Security validations
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        securityIssues.push('SESSION_SECRET is too weak (minimum 32 characters required)');
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        securityIssues.push('JWT_SECRET is too weak (minimum 32 characters required)');
    }
    // Check for common weak secrets
    const weakSecrets = ['secret', 'password', '123456', 'admin', 'test'];
    if (process.env.SESSION_SECRET && weakSecrets.some(weak => process.env.SESSION_SECRET.toLowerCase().includes(weak))) {
        securityIssues.push('SESSION_SECRET appears to be weak or default');
    }
    if (process.env.JWT_SECRET && weakSecrets.some(weak => process.env.JWT_SECRET.toLowerCase().includes(weak))) {
        securityIssues.push('JWT_SECRET appears to be weak or default');
    }
    // Check service availability
    const services = {
        database: !!process.env.DATABASE_URL,
        helius: !!process.env.HELIUS_API_KEY,
        ipfs: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
        clout: !!(process.env.CLOUT_MINT && process.env.CLOUT_TREASURY)
    };
    return {
        isValid: missing.length === 0 && securityIssues.length === 0,
        missing,
        warnings,
        securityIssues,
        services
    };
}
function logEnvironmentStatus() {
    const status = validateEnvironment();
    const appConfig = (0, environment_1.getAppConfig)();
    console.log('🔧 Environment Configuration Status:');
    console.log(`   Environment: ${appConfig.env}`);
    console.log(`   Port: ${appConfig.port}`);
    console.log(`   Log Level: ${appConfig.logLevel}`);
    console.log(`   Allowed Origins: ${appConfig.allowedOrigins.join(', ')}`);
    if (status.isValid) {
        console.log('✅ All required environment variables are set');
    }
    else {
        console.log('❌ Missing required environment variables:');
        status.missing.forEach(env => console.log(`   - ${env}`));
    }
    if (status.securityIssues.length > 0) {
        console.log('🚨 Security Issues:');
        status.securityIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    if (status.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        status.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    console.log('🔌 Service Status:');
    console.log(`   Database: ${status.services.database ? '✅' : '❌'}`);
    console.log(`   Helius: ${status.services.helius ? '✅' : '❌'}`);
    console.log(`   IPFS: ${status.services.ipfs ? '✅' : '❌'}`);
    console.log(`   CLOUT: ${status.services.clout ? '✅' : '❌'}`);
}
function validateEnvironmentAndExit() {
    const result = validateEnvironment();
    const isProduction = process.env.NODE_ENV === 'production';
    // In production, fail on missing required vars or security issues
    // In development, only fail on truly critical missing vars
    if (isProduction && !result.isValid) {
        console.error('🚨 Environment validation failed!');
        logEnvironmentStatus();
        process.exit(1);
    }
    if (isProduction && result.securityIssues.length > 0) {
        console.error('🚨 Security issues detected!');
        logEnvironmentStatus();
        process.exit(1);
    }
    // In development, only fail on critical missing vars
    if (!isProduction && result.missing.length > 0) {
        console.warn('⚠️  Missing some required environment variables');
    }
    logEnvironmentStatus();
}
