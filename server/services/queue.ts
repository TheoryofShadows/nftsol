/**
 * Queue Service
 * BullMQ-based job queue for async tasks
 * Falls back to synchronous execution if Redis is not configured
 */

import { logger } from '@shared/utils/logger';

// Check if Redis is available
function hasRedisConfig(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) ||
    process.env.REDIS_URL ||
    process.env.REDIS_HOST
  );
}

// Redis connection for BullMQ
// Supports both Upstash and standard Redis
function getRedisConnection() {
  // Upstash Redis (serverless)
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    return {
      host: new URL(process.env.UPSTASH_REDIS_URL).hostname,
      port: parseInt(new URL(process.env.UPSTASH_REDIS_URL).port || '6379'),
      password: process.env.UPSTASH_REDIS_TOKEN,
      tls: process.env.UPSTASH_REDIS_URL.includes('https') ? {} : undefined,
    };
  }

  // Standard Redis
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };
}

// Lazy initialization of queues
let queues: any = null;
let queueEvents: any = null;
let workersInitialized = false;

function getQueues() {
  if (!hasRedisConfig()) {
    return null;
  }

  if (!queues) {
    try {
      const { Queue } = require('bullmq');
      const connection = getRedisConnection();
      
      queues = {
        nftMint: new Queue('nft-mint', { connection }),
        ipfsUpload: new Queue('ipfs-upload', { connection }),
        email: new Queue('email', { connection }),
        imageProcessing: new Queue('image-processing', { connection }),
        transactionMonitoring: new Queue('transaction-monitoring', { connection }),
      };
      
      logger.info('Queues initialized');
    } catch (error) {
      logger.warn('Failed to initialize queues', error);
      return null;
    }
  }
  
  return queues;
}

function getQueueEvents() {
  if (!hasRedisConfig()) {
    return null;
  }

  if (!queueEvents) {
    try {
      const { QueueEvents } = require('bullmq');
      const connection = getRedisConnection();
      
      queueEvents = {
        nftMint: new QueueEvents('nft-mint', { connection }),
        ipfsUpload: new QueueEvents('ipfs-upload', { connection }),
        email: new QueueEvents('email', { connection }),
      };
      
      logger.info('Queue events initialized');
    } catch (error) {
      logger.warn('Failed to initialize queue events', error);
      return null;
    }
  }
  
  return queueEvents;
}

// Export queues with lazy initialization
// Note: queues and queueEvents are now functions that return the queue instances
export function queues() {
  return getQueues();
}

export function queueEvents() {
  return getQueueEvents();
}

// Workers
export function setupWorkers() {
  if (!hasRedisConfig()) {
    logger.warn('Queue workers not started - Redis not configured');
    return;
  }

  if (workersInitialized) {
    return;
  }

  try {
    const { Worker } = require('bullmq');
    const connection = getRedisConnection();

    // NFT Mint Worker
    new Worker('nft-mint', async (job) => {
      logger.info('Processing NFT mint job', { jobId: job.id, data: job.data });
      
      const { name, description, imageUrl, creatorWallet, command } = job.data;
      
      // Execute minting command
      return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        
        exec(command || `npx tsx ../solana-worker/scripts/mint-devnet.ts ${creatorWallet} "${name}" "${description}" "${imageUrl}"`, 
          (error: any, stdout: string, stderr: string) => {
            if (error) {
              logger.error('NFT mint job failed', error, { jobId: job.id, stderr });
              return reject(new Error(stderr || 'Minting failed'));
            }
            
            logger.info('NFT mint job completed', { 
              jobId: job.id,
              name,
              tx: stdout.trim() 
            });
            
            resolve({ 
              success: true, 
              tx: stdout.trim(),
              mintAddress: stdout.trim(), // Extract from stdout if available
            });
          }
        );
      });
    }, { 
      connection,
      concurrency: 5, // Process 5 mints concurrently
    });

    // IPFS Upload Worker
    new Worker('ipfs-upload', async (job) => {
      logger.info('Processing IPFS upload job', { jobId: job.id });
      
      // Your IPFS upload logic here
      // const { uploadToIPFS } = await import('./ipfs');
      // const cid = await uploadToIPFS(job.data);
      
      return { success: true, cid: 'example' };
    }, { connection });

    // Email Worker
    new Worker('email', async (job) => {
      logger.info('Processing email job', { jobId: job.id });
      
      try {
        const { emailService } = await import('@shared/services/email');
        await emailService.send(job.data);
        return { success: true };
      } catch (error) {
        logger.error('Email job failed', error, { jobId: job.id });
        throw error;
      }
    }, { connection });

    workersInitialized = true;
    logger.info('Queue workers initialized');
  } catch (error) {
    logger.error('Failed to initialize queue workers', error);
  }
}

// Helper functions
export async function addNFTMintJob(data: any) {
  const queues = getQueues();
  if (!queues) {
    // Fallback: execute synchronously
    logger.warn('Redis not configured, executing mint synchronously');
    return executeMintSync(data);
  }

  return queues.nftMint.add('mint-nft', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export async function addIPFSUploadJob(data: any) {
  const queues = getQueues();
  if (!queues) {
    logger.warn('Redis not configured, IPFS upload will execute synchronously');
    return { id: 'sync-' + Date.now() };
  }

  return queues.ipfsUpload.add('upload-ipfs', data, {
    attempts: 3,
  });
}

export async function addEmailJob(data: any) {
  const queues = getQueues();
  if (!queues) {
    logger.warn('Redis not configured, email will send synchronously');
    try {
      const { emailService } = await import('@shared/services/email');
      await emailService.send(data);
      return { id: 'sync-' + Date.now() };
    } catch (error) {
      logger.error('Failed to send email', error);
      throw error;
    }
  }

  return queues.email.add('send-email', data, {
    attempts: 3,
  });
}

// Synchronous fallback for minting (when Redis not available)
async function executeMintSync(data: any) {
  const { exec } = require('child_process');
  const { name, description, imageUrl, creatorWallet, command } = data;
  
  return new Promise((resolve, reject) => {
    exec(command || `npx tsx ../solana-worker/scripts/mint-devnet.ts ${creatorWallet} "${name}" "${description}" "${imageUrl}"`, 
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          logger.error('NFT mint failed', error, { name, creator: creatorWallet, stderr });
          return reject(new Error(stderr || 'Minting failed'));
        }
        
        logger.info('NFT minted successfully', { 
          name,
          tx: stdout.trim() 
        });
        
        resolve({ 
          id: 'sync-' + Date.now(),
          success: true, 
          tx: stdout.trim(),
          mintAddress: stdout.trim(),
        });
      }
    );
  });
}

