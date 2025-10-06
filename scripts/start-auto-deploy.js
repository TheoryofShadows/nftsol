#!/usr/bin/env node

/**
 * Start Auto-Deploy Monitor
 * 
 * Simple script to start the auto-deployment monitoring
 */

import { startMonitoring } from './auto-deploy-monitor.js';

console.log('🚀 Starting CLOUT Token Auto-Deploy System...');
console.log('This will monitor your treasury wallet and automatically deploy');
console.log('the CLOUT token when sufficient SOL is detected.\n');

startMonitoring().catch(console.error);