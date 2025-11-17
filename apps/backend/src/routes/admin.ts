import express, { Request, Response } from 'express';
import { pool } from '../lib/db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ============================================
// ADMIN AUTHENTICATION
// ============================================

/**
 * Admin login (simple JWT approach)
 * In production, use OAuth2 / SSO
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
      });
    }

    // Get admin account
    const result = await pool.query(
      `SELECT id, email, "passwordHash", role, status FROM saas_admin_accounts WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const admin = result.rows[0];

    // Verify password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (passwordHash !== admin.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        error: 'Admin account is not active',
      });
    }

    // Generate JWT token (in production, use proper JWT library)
    const token = crypto.randomBytes(32).toString('hex');

    // TODO: Store token in cache with expiration
    // For now, just return it

    res.json({
      success: true,
      data: {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * Create new admin account (superadmin only)
 */
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'admin' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const adminId = uuidv4();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    await pool.query(
      `
      INSERT INTO saas_admin_accounts (id, email, "passwordHash", role, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `,
      [adminId, email, passwordHash, role, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Admin account created',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Admin account already exists',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// TENANT MANAGEMENT DASHBOARD
// ============================================

/**
 * GET /admin/tenants
 * List all tenants with summary stats
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);
    const statusFilter =
      status && status !== 'all' ? `AND status = '${status}'` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM saas_tenants WHERE "deletedAt" IS NULL ${statusFilter}`
    );

    // Get tenants with stats
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
        t."updatedAt",
        (SELECT COUNT(*) FROM saas_tenant_users WHERE "tenantId" = t.id)::int as users,
        (SELECT COUNT(*) FROM saas_tenant_nfts WHERE "tenantId" = t.id)::int as nfts,
        (SELECT COUNT(*) FROM saas_tenant_collections WHERE "tenantId" = t.id)::int as collections,
        (SELECT COUNT(*) FROM saas_api_request_logs WHERE "tenantId" = t.id AND "createdAt" > NOW() - INTERVAL '7 days')::int as requests_7d
      FROM saas_tenants t
      WHERE t."deletedAt" IS NULL ${statusFilter}
      ORDER BY t."createdAt" DESC
      LIMIT $1 OFFSET $2
      `,
      [parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: {
        tenants: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /admin/tenants/:tenantId
 * Get detailed tenant information
 */
router.get('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const result = await pool.query(
      `
      SELECT
        t.*,
        (SELECT COUNT(*) FROM saas_tenant_users WHERE "tenantId" = t.id)::int as users_count,
        (SELECT COUNT(*) FROM saas_tenant_nfts WHERE "tenantId" = t.id)::int as nfts_count,
        (SELECT COUNT(*) FROM saas_tenant_collections WHERE "tenantId" = t.id)::int as collections_count,
        (SELECT COUNT(*) FROM saas_tenant_api_keys WHERE "tenantId" = t.id AND "deletedAt" IS NULL)::int as api_keys_count
      FROM saas_tenants t
      WHERE t.id = $1
      `,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
      });
    }

    // Get recent activity
    const activityResult = await pool.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        AVG("responseTimeMs") as avg_response_time,
        COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END) as errors
      FROM saas_api_request_logs
      WHERE "tenantId" = $1
        AND "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      `,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        tenant: result.rows[0],
        activity: activityResult.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/tenants/:tenantId
 * Update tenant (admin only)
 */
router.patch('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { name, status, planId, monthlyRevenueCut } = req.body;

    const updates = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (planId !== undefined) {
      updates.push(`"planId" = $${paramIndex++}`);
      params.push(planId);
    }
    if (monthlyRevenueCut !== undefined) {
      updates.push(`"monthlyRevenueCut" = $${paramIndex++}`);
      params.push(monthlyRevenueCut);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
      });
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(tenantId);

    await pool.query(
      `
      UPDATE saas_tenants
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      `,
      params
    );

    res.json({
      success: true,
      message: 'Tenant updated',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// BILLING & REVENUE DASHBOARD
// ============================================

/**
 * GET /admin/revenue
 * Revenue summary across all tenants
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = "AND bi.\"createdAt\" > NOW() - INTERVAL '1 month'";
    if (period === 'year') {
      dateFilter = "AND bi.\"createdAt\" > NOW() - INTERVAL '1 year'";
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(DISTINCT t.id)::int as tenant_count,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END)::int as active_tenants,
        SUM(COALESCE(bi.total, 0))::int as total_revenue,
        SUM(COALESCE(bi.total, 0)) FILTER (WHERE bi.status = 'paid')::int as paid_revenue,
        AVG(COALESCE(bi.total, 0))::int as avg_invoice_value,
        t."planId",
        COUNT(*)::int as invoice_count
      FROM saas_tenants t
      LEFT JOIN saas_billing_invoices bi ON t.id = bi."tenantId" ${dateFilter}
      WHERE t."deletedAt" IS NULL
      GROUP BY t."planId"
      ORDER BY total_revenue DESC NULLS LAST
      `
    );

    res.json({
      success: true,
      data: {
        period,
        summary: result.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /admin/invoices
 * List all invoices
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);
    const statusFilter = status ? `AND bi.status = '${status}'` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM saas_billing_invoices bi WHERE 1=1 ${statusFilter}`
    );

    const result = await pool.query(
      `
      SELECT
        bi.id,
        bi."invoiceNumber",
        bi.total,
        bi.status,
        bi."createdAt",
        bi."paidAt",
        t.name,
        t.slug
      FROM saas_billing_invoices bi
      JOIN saas_tenants t ON bi."tenantId" = t.id
      WHERE 1=1 ${statusFilter}
      ORDER BY bi."createdAt" DESC
      LIMIT $1 OFFSET $2
      `,
      [parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: parseInt(countResult.rows[0].total),
        },
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
// SYSTEM HEALTH & ANALYTICS
// ============================================

/**
 * GET /admin/health
 * System health dashboard
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM saas_tenants WHERE status = 'active')::int as active_tenants,
        (SELECT COUNT(*) FROM saas_tenants WHERE "createdAt" > NOW() - INTERVAL '7 days')::int as new_tenants_7d,
        (SELECT COUNT(*) FROM saas_tenant_users)::int as total_users,
        (SELECT COUNT(*) FROM saas_tenant_nfts)::int as total_nfts,
        (SELECT COUNT(DISTINCT "tenantId") FROM saas_api_request_logs WHERE "createdAt" > NOW() - INTERVAL '24 hours')::int as active_tenants_24h,
        (SELECT COUNT(*) FROM saas_api_request_logs WHERE "createdAt" > NOW() - INTERVAL '24 hours' AND "statusCode" >= 400)::int as errors_24h,
        (SELECT AVG("responseTimeMs") FROM saas_api_request_logs WHERE "createdAt" > NOW() - INTERVAL '24 hours')::int as avg_response_time_ms
      `
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================
// SUPPORT TICKETS
// ============================================

/**
 * GET /admin/support-tickets
 * List support tickets
 */
router.get('/support-tickets', async (req: Request, res: Response) => {
  try {
    const { status = 'open', page = 1, limit = 20 } = req.query;

    const offset = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);

    const result = await pool.query(
      `
      SELECT
        st.id,
        st.subject,
        st.priority,
        st.status,
        st."createdAt",
        st."updatedAt",
        t.name as tenant_name,
        t.slug
      FROM saas_support_tickets st
      JOIN saas_tenants t ON st."tenantId" = t.id
      WHERE st.status = $1
      ORDER BY
        CASE st.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        st."createdAt" ASC
      LIMIT $2 OFFSET $3
      `,
      [status, parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
