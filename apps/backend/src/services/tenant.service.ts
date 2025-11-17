import { pool } from '../lib/db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant Service
 * Manages SaaS customer accounts and their configurations
 */

export interface CreateTenantRequest {
  name: string; // Marketplace name
  slug: string; // URL slug
  email: string; // Contact email
  website?: string;
  description?: string;
  logoUrl?: string;
}

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: string;
  planId: string;
  createdAt: string;
  apiKeysCount: number;
  usersCount: number;
  nftsCount: number;
}

/**
 * Create a new tenant (onboard SaaS customer)
 */
export async function createTenant(req: CreateTenantRequest): Promise<{ id: string; slug: string; apiKey: string }> {
  const tenantId = uuidv4();
  const initialApiKey = generateApiKey();
  const hashedKey = hashApiKey(initialApiKey);

  try {
    // Create tenant
    await pool.query(
      `
      INSERT INTO saas_tenants (id, name, slug, email, website, description, "logoUrl", status, "planId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `,
      [
        tenantId,
        req.name,
        req.slug,
        req.email,
        req.website || null,
        req.description || null,
        req.logoUrl || null,
        'active',
        'starter',
      ]
    );

    // Create initial API key
    const apiKeyId = uuidv4();
    const keyPreview = initialApiKey.slice(-8);

    await pool.query(
      `
      INSERT INTO saas_tenant_api_keys (id, "tenantId", name, key, "keyPreview", permissions, "rateLimit", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `,
      [
        apiKeyId,
        tenantId,
        'Default Key',
        hashedKey,
        keyPreview,
        JSON.stringify(['read:*', 'write:*']),
        1000, // Default 1000 requests/hour
      ]
    );

    // Create usage tracking record
    const billingStart = new Date();
    const billingEnd = new Date(billingStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO saas_tenant_usage ("tenantId", "billingPeriodStart", "billingPeriodEnd", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      `,
      [tenantId, billingStart, billingEnd]
    );

    return {
      id: tenantId,
      slug: req.slug,
      apiKey: initialApiKey, // Return unhashed key only once
    };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

/**
 * Get tenant details
 */
export async function getTenantDetails(tenantId: string): Promise<TenantDetails | null> {
  try {
    const result = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.email,
        t.status,
        t."planId",
        t."createdAt",
        (SELECT COUNT(*) FROM saas_tenant_api_keys WHERE "tenantId" = t.id AND "deletedAt" IS NULL)::int as "apiKeysCount",
        (SELECT COUNT(*) FROM saas_tenant_users WHERE "tenantId" = t.id)::int as "usersCount",
        (SELECT COUNT(*) FROM saas_tenant_nfts WHERE "tenantId" = t.id)::int as "nftsCount"
      FROM saas_tenants t
      WHERE t.id = $1 AND t."deletedAt" IS NULL
      `,
      [tenantId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting tenant details:', error);
    throw error;
  }
}

/**
 * Update tenant configuration
 */
export async function updateTenantConfig(
  tenantId: string,
  config: Record<string, any>
): Promise<void> {
  try {
    await pool.query(
      `
      UPDATE saas_tenants
      SET config = jsonb_set(config, '{0}', $2::jsonb),
          "updatedAt" = NOW()
      WHERE id = $1
      `,
      [tenantId, JSON.stringify(config)]
    );
  } catch (error) {
    console.error('Error updating tenant config:', error);
    throw error;
  }
}

/**
 * Create new API key for tenant
 */
export async function createTenantApiKey(
  tenantId: string,
  name: string,
  permissions?: string[]
): Promise<{ key: string; preview: string }> {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  const keyPreview = apiKey.slice(-8);
  const apiKeyId = uuidv4();

  try {
    await pool.query(
      `
      INSERT INTO saas_tenant_api_keys (id, "tenantId", name, key, "keyPreview", permissions, "rateLimit", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `,
      [
        apiKeyId,
        tenantId,
        name,
        hashedKey,
        keyPreview,
        JSON.stringify(permissions || ['read:*', 'write:*']),
        1000,
      ]
    );

    return {
      key: apiKey,
      preview: keyPreview,
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

/**
 * List all API keys for tenant
 */
export async function listTenantApiKeys(tenantId: string): Promise<any[]> {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        "keyPreview",
        permissions,
        "rateLimit",
        "lastUsedAt",
        "createdAt"
      FROM saas_tenant_api_keys
      WHERE "tenantId" = $1 AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      `,
      [tenantId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error listing API keys:', error);
    throw error;
  }
}

/**
 * Revoke API key
 */
export async function revokeTenantApiKey(keyId: string): Promise<void> {
  try {
    await pool.query(
      `
      UPDATE saas_tenant_api_keys
      SET "deletedAt" = NOW()
      WHERE id = $1
      `,
      [keyId]
    );
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw error;
  }
}

/**
 * Get tenant usage metrics
 */
export async function getTenantUsage(tenantId: string): Promise<any> {
  try {
    const result = await pool.query(
      `
      SELECT
        "billingPeriodStart",
        "billingPeriodEnd",
        "apiCallsCount",
        "nftCreatedCount",
        "usersCount",
        "transactionVolume",
        "overageCharge"
      FROM saas_tenant_usage
      WHERE "tenantId" = $1
      ORDER BY "billingPeriodStart" DESC
      LIMIT 1
      `,
      [tenantId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting tenant usage:', error);
    throw error;
  }
}

/**
 * Record API call for usage tracking
 */
export async function recordApiCall(
  tenantId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  userIp: string
): Promise<void> {
  try {
    await pool.query(
      `
      INSERT INTO saas_api_request_logs
        ("tenantId", endpoint, method, "statusCode", "responseTimeMs", "userIp", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      [tenantId, endpoint, method, statusCode, responseTimeMs, userIp]
    );
  } catch (error) {
    // Don't throw on logging errors
    console.warn('Error logging API call:', error);
  }
}

/**
 * Get analytics for tenant
 */
export async function getTenantAnalytics(tenantId: string, days: number = 30): Promise<any> {
  try {
    const result = await pool.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as request_count,
        AVG("responseTimeMs") as avg_response_time,
        COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END) as error_count
      FROM saas_api_request_logs
      WHERE "tenantId" = $1
        AND "createdAt" > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      `,
      [tenantId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting tenant analytics:', error);
    throw error;
  }
}

/**
 * Update tenant plan
 */
export async function updateTenantPlan(tenantId: string, planId: string): Promise<void> {
  try {
    await pool.query(
      `
      UPDATE saas_tenants
      SET "planId" = $1, "updatedAt" = NOW()
      WHERE id = $2
      `,
      [planId, tenantId]
    );
  } catch (error) {
    console.error('Error updating tenant plan:', error);
    throw error;
  }
}

/**
 * Suspend tenant
 */
export async function suspendTenant(tenantId: string, reason?: string): Promise<void> {
  try {
    await pool.query(
      `
      UPDATE saas_tenants
      SET status = 'suspended', "updatedAt" = NOW()
      WHERE id = $1
      `,
      [tenantId]
    );

    // Log suspension
    if (reason) {
      console.log(`Tenant ${tenantId} suspended: ${reason}`);
    }
  } catch (error) {
    console.error('Error suspending tenant:', error);
    throw error;
  }
}

/**
 * Delete tenant (soft delete)
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  try {
    await pool.query(
      `
      UPDATE saas_tenants
      SET status = 'deleted', "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = $1
      `,
      [tenantId]
    );
  } catch (error) {
    console.error('Error deleting tenant:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate API key (format: sk_test_xxx or sk_live_xxx)
 */
function generateApiKey(prefix: string = 'sk_test_'): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * Hash API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key (for testing)
 */
export function verifyApiKey(providedKey: string, hashedKey: string): boolean {
  const hash = crypto.createHash('sha256').update(providedKey).digest('hex');
  return hash === hashedKey;
}
