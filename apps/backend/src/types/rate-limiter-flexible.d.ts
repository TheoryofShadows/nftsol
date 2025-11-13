declare module 'rate-limiter-flexible' {
  import { Redis } from 'ioredis';

  export interface IRateLimiterRedisOptions {
    storeClient: Redis;
    points: number;
    duration: number;
    blockDuration?: number;
    inMemoryBlockOnConsumed?: number;
    inMemoryBlockDuration?: number;
    keyPrefix?: string;
    storeType?: string;
    execEvenly?: boolean;
    execEvenlyMinDelayMs?: number;
    indexKey?: string;
  }

  export class RateLimiterRedis {
    constructor(options: IRateLimiterRedisOptions);
    consume(key: string, points?: number, options?: any): Promise<void>;
    get(key: string): Promise<{
      remainingPoints: number;
      msBeforeNext: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }>;
    block(key: string, secDuration: number): Promise<void>;
    delete(key: string): Promise<void>;
  }

  export class RateLimiterMemory {
    constructor(options: {
      points: number;
      duration: number;
      blockDuration?: number;
      keyPrefix?: string;
    });
    consume(key: string, points?: number, options?: any): Promise<{
      remainingPoints: number;
      msBeforeNext: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }>;
    get(key: string): Promise<{
      remainingPoints: number;
      msBeforeNext: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }>;
    block(key: string, secDuration: number): Promise<void>;
    delete(key: string): Promise<void>;
  }

  export class RateLimiterRes {
    constructor(remainingPoints: number, msBeforeNext: number, consumedPoints: number, isFirstInDuration: boolean);
    remainingPoints: number;
    msBeforeNext: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
  }

  export class RateLimiterAbstract {
    consume(key: string, points?: number, options?: any): Promise<RateLimiterRes>;
    get(key: string): Promise<RateLimiterRes>;
    set(key: string, points: number, durationSec: number): Promise<boolean>;
    block(key: string, secDuration: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    deleteInMemoryBlockedAll(): number;
    getKey(key: string): string;
    parseKey(key: string): string;
  }
}
