import { Request, Response, NextFunction } from 'express';
import { pool } from '../lib/db';
import crypto from 'crypto';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('tenant');

/**
 * Tenant context - Attached to each request for isolation
 */
export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantEmail: string;
  apiKeyId?: string;
  apiKeyName?: string;
  permissions: string[];
}

/**
 * Extend Express Request to include tenant context
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantId?: string; // Shorthand
    }
  }
}

/**
 * Hash API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Authenticate API Key
 * Expected header: Authorization: Bearer sk_xxx
 * Or: X-API-Key: sk_xxx
 */
export async function authenticateApiKey(req: Request): Promise<TenantContext | null> {
  try {
    // Get API key from headers
    let apiKey = '';
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.slice(7);
    } else if (req.headers['x-api-key']) {
      apiKey = req.headers['x-api-key'] as string;
    }

    if (!apiKey) {
      return null;
    }

    // Hash the provided key
    const hashedKey = hashApiKey(apiKey);

    // Query database for the API key
    const result = await pool.query(
      `
      SELECT
        ak.id as api_key_id,
        ak.name as api_key_name,
        ak.permissions,
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug as tenant_slug,
        t.email as tenant_email
      FROM saas_tenant_api_keys ak
      JOIN saas_tenants t ON ak.tenant_id = t.id
      WHERE ak.key = $1
        AND ak."deletedAt" IS NULL
        AND t.status = 'active'
      LIMIT 1
      `,
      [hashedKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Update last used timestamp
    await pool.query(
      'UPDATE saas_tenant_api_keys SET "lastUsedAt" = NOW() WHERE id = $1',
      [row.api_key_id]
    );

    return {
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      tenantSlug: row.tenant_slug,
      tenantEmail: row.tenant_email,
      apiKeyId: row.api_key_id,
      apiKeyName: row.api_key_name,
      permissions: row.permissions || [],
    };
  } catch (error) {
    log.error('Error authenticating API key:', error);
    return null;
  }
}

/**
 * Tenant middleware - Validates and attaches tenant context to request
 * REQUIRED for all protected routes
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to authenticate via API key
    const tenantContext = await authenticateApiKey(req);

    if (!tenantContext) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
      });
    }

    // Attach tenant context to request
    req.tenant = tenantContext;
    req.tenantId = tenantContext.tenantId;

    next();
  } catch (error) {
    log.error('Tenant middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate tenant',
    });
  }
}

/**
 * Permission checker - Validates if tenant has required permission
 */
export function requirePermission(requiredPermissions: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant context not found',
      });
    }

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasPermission = permissions.some((perm) => req.tenant!.permissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Rate limiting per tenant
 */
export async function enforceRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return next();
  }

  try {
    // Get rate limit from API key
    const result = await pool.query(
      `
      SELECT rate_limit FROM saas_tenant_api_keys
      WHERE id = $1
      `,
      [req.tenant.apiKeyId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'API key not found' });
    }

    const rateLimit = result.rows[0].rate_limit;

    // Check current request count (in last hour)
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as request_count
      FROM saas_api_request_logs
      WHERE "tenantId" = $1
        AND "createdAt" > NOW() - INTERVAL '1 hour'
      `,
      [req.tenant.tenantId]
    );

    const requestCount = parseInt(countResult.rows[0].request_count, 10);

    // Add rate limit headers
    res.set('X-RateLimit-Limit', rateLimit.toString());
    res.set('X-RateLimit-Remaining', (rateLimit - requestCount - 1).toString());

    if (requestCount >= rateLimit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded your rate limit of ${rateLimit} requests per hour`,
        retryAfter: 3600,
      });
    }

    // Log this request
    await pool.query(
      `
      INSERT INTO saas_api_request_logs
        ("tenantId", endpoint, method, "statusCode", "createdAt")
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [req.tenant.tenantId, req.path, req.method, 200]
    );

    next();
  } catch (error) {
    log.error('Rate limit error:', error);
    // Don't block on rate limit errors, just log
    next();
  }
}

/**
 * Ensure all queries are scoped to tenant
 * Usage: db queries should always include WHERE tenant_id = $X
 */
export function getTenantFilter(tenantId: string): { tenantId: string } {
  return { tenantId };
}

/**
 * Build WHERE clause for tenant-scoped queries
 * NOTE: This function returns a template string. Parameters must be passed separately
 * to avoid SQL injection. Use parameterized queries instead.
 *
 * DEPRECATED: Use parameterized queries directly instead
 * Example: pool.query('SELECT * FROM table WHERE "tenantId" = $1', [tenantId])
 */
export function buildTenantWhereClause(tenantId: string, tableAlias?: string): string {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  // Return placeholder for parameterized query - actual parameter binding must be done by caller
  return `${prefix}"tenantId" = $1`;
}
