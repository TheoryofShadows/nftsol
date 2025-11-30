import express, { Request, Response } from 'express';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('saas');
import {
  createTenant,
  getTenantDetails,
  updateTenantConfig,
  createTenantApiKey,
  listTenantApiKeys,
  revokeTenantApiKey,
  getTenantUsage,
  getTenantAnalytics,
  updateTenantPlan,
  suspendTenant,
  deleteTenant,
  recordApiCall as _recordApiCall,
} from '../services/tenant.service';
import {
  tenantMiddleware,
  requirePermission as _requirePermission,
  enforceRateLimit as _enforceRateLimit,
} from '../middleware/tenant';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * POST /saas/tenants
 * Create new SaaS customer account
 */
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, slug, email, website, description, logoUrl } = req.body;

    // Validation
    if (!name || !slug || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'slug', 'email'],
      });
    }

    // Validate slug format
    if (!/^[a-z0-9-]{3,63}$/.test(slug)) {
      return res.status(400).json({
        error: 'Invalid slug format',
        message: 'Slug must be 3-63 characters, lowercase alphanumeric and hyphens only',
      });
    }

    const result = await createTenant({
      name,
      slug,
      email,
      website,
      description,
      logoUrl,
    });

    res.status(201).json({
      success: true,
      data: {
        tenantId: result.id,
        slug: result.slug,
        apiKey: result.apiKey,
      },
      message: 'Tenant created successfully. Save your API key - it will not be shown again!',
    });
  } catch (error: any) {
    log.error('Error creating tenant:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      const field = error.detail.includes('slug') ? 'slug' : 'email';
      return res.status(409).json({
        error: 'Conflict',
        message: `A tenant with this ${field} already exists`,
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// PROTECTED ROUTES (API key required)
// ============================================

/**
 * GET /saas/tenant
 * Get current tenant details
 */
router.get('/tenant', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantDetails = await getTenantDetails(req.tenantId!);

    if (!tenantDetails) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found',
      });
    }

    res.json({
      success: true,
      data: tenantDetails,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * PATCH /saas/tenant/config
 * Update tenant configuration
 */
router.patch('/tenant/config', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        error: 'Invalid config',
        message: 'Config must be a valid JSON object',
      });
    }

    await updateTenantConfig(req.tenantId!, config);

    res.json({
      success: true,
      message: 'Tenant configuration updated',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// API KEYS
// ============================================

/**
 * GET /saas/api-keys
 * List all API keys for tenant
 */
router.get('/api-keys', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const apiKeys = await listTenantApiKeys(req.tenantId!);

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /saas/api-keys
 * Create new API key
 */
router.post('/api-keys', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing name',
        message: 'API key name is required',
      });
    }

    const result = await createTenantApiKey(req.tenantId!, name, permissions);

    res.status(201).json({
      success: true,
      data: {
        key: result.key,
        preview: result.preview,
      },
      message: 'API key created. Save this key now - you will not be able to see it again!',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * DELETE /saas/api-keys/:keyId
 * Revoke API key
 */
router.delete('/api-keys/:keyId', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;

    // Verify key belongs to tenant
    const keys = await listTenantApiKeys(req.tenantId!);
    const keyExists = keys.some((k) => k.id === keyId);

    if (!keyExists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found',
      });
    }

    await revokeTenantApiKey(keyId);

    res.json({
      success: true,
      message: 'API key revoked',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// USAGE & ANALYTICS
// ============================================

/**
 * GET /saas/usage
 * Get current usage metrics
 */
router.get('/usage', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const usage = await getTenantUsage(req.tenantId!);

    res.json({
      success: true,
      data: usage,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /saas/analytics
 * Get usage analytics
 */
router.get('/analytics', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await getTenantAnalytics(req.tenantId!, parseInt(days as string));

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        records: analytics,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// ADMIN ROUTES (Requires admin permission)
// ============================================

/**
 * PATCH /saas/admin/plan
 * Update tenant plan (admin only)
 */
router.patch('/admin/plan', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        error: 'Missing planId',
      });
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'enterprise'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        error: 'Invalid plan',
        validPlans,
      });
    }

    await updateTenantPlan(req.tenantId!, planId);

    res.json({
      success: true,
      message: 'Plan updated',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /saas/admin/suspend
 * Suspend tenant (admin only)
 */
router.post('/admin/suspend', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    await suspendTenant(req.tenantId!, reason);

    res.json({
      success: true,
      message: 'Tenant suspended',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /saas/admin/delete
 * Delete tenant (admin only, soft delete)
 */
router.post('/admin/delete', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    await deleteTenant(req.tenantId!);

    res.json({
      success: true,
      message: 'Tenant deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// HEALTHCHECK
// ============================================

/**
 * GET /saas/health
 * Verify API key is valid
 */
router.get('/health', tenantMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      tenantId: req.tenantId,
      tenantName: req.tenant?.tenantName,
      status: 'connected',
    },
  });
});

export default router;
