import { getHeliusConfig } from "./config/environment";

const heliusConfig = {
  ...getHeliusConfig(),
  timeoutMs: 15000, // Increased timeout for better reliability
  retryAttempts: 3,
  batchSize: 50, // Batch requests for efficiency
  cacheTimeout: 300000 // 5 minutes cache
};

// Circuit breaker state
let circuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

function resetCircuitBreaker() {
  circuitBreakerState.failures = 0;
  circuitBreakerState.isOpen = false;
}

function recordFailure() {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    console.warn('🔴 Helius circuit breaker opened due to multiple failures');
  }
}

function checkCircuitBreaker() {
  if (!circuitBreakerState.isOpen) return true;
  
  // Try to close after timeout
  if (Date.now() - circuitBreakerState.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    console.log('🟡 Helius circuit breaker half-open, testing...');
    circuitBreakerState.isOpen = false;
    return true;
  }
  
  return false;
}

async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = heliusConfig.retryAttempts,
  initialDelay: number = 1000
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Reset circuit breaker on success
      if (attempt > 0) {
        resetCircuitBreaker();
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) break;
      
      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt);
      
      console.warn(`Helius request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  recordFailure();
  throw lastError;
}

export type SimpleItem = {
  mint: string;
  name: string;
  image: string;
  collection: string;
};

export function toSimpleItem(it: any): SimpleItem | null {
  if (!it) return null;

  const id = it.id ?? it.mint ?? it.token_info?.mint ?? null;
  if (!id) return null;

  const name =
    it.content?.metadata?.name ??
    it.content?.metadata?.symbol ??
    it.token_info?.symbol ??
    "Untitled";

  const image =
    it.content?.files?.[0]?.uri ??
    it.content?.links?.image ??
    "https://placehold.co/400x400?text=Asset";

  const collection =
    it.grouping?.find((g: any) => g.group_key === "collection")?.group_value ??
    it.token_info?.token_program ??
    "Unknown Collection";

  return {
    mint: String(id),
    name: String(name),
    image: String(image),
    collection: String(collection),
  };
}

export function toSimpleItems(items: any[]): SimpleItem[] {
  return (items || []).map(toSimpleItem).filter(Boolean) as SimpleItem[];
}

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

/** DAS owner query with correct sort casing and retry logic */
export async function getAssetsByOwner(ownerAddress: string) {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    console.warn('🔴 Helius circuit breaker is OPEN, skipping request');
    return [];
  }

  const body = {
    jsonrpc: "2.0",
    id: "getAssetsByOwner",
    method: "getAssetsByOwner",
    params: {
      ownerAddress,
      page: 1,
      limit: 100,
      sortBy: { sortBy: "recent_action", sortDirection: "desc" },
      displayOptions: { showFungible: true },
    },
  };

  return retryWithBackoff(async () => {
    const timeout = createTimeoutController(heliusConfig.timeoutMs);

    try {
      const res = await fetch(heliusConfig.rpcUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body),
        signal: timeout.signal,
      });

      // Handle rate limiting
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        console.warn(`⏳ Helius rate limited, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        throw new Error('Rate limited, retrying...');
      }

      if (!res.ok) {
        throw new Error(`Helius API returned ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.error) {
        console.warn("⚠️ Helius error:", json.error);
        return [];
      }
      
      const items = json.result?.items ?? [];
      return toSimpleItems(items);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.error("[helius] request timed out", { ownerAddress });
        throw new Error(`Request timeout after ${heliusConfig.timeoutMs}ms`);
      }
      throw error;
    } finally {
      timeout.clear();
    }
  });
}
