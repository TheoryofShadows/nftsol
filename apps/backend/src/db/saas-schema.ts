import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ============================================
// SAAS CORE TABLES
// ============================================

/**
 * Tenants table - Represents each SaaS customer/marketplace instance
 */
export const tenants = pgTable('saas_tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // Customer marketplace name
  slug: text('slug').notNull().unique(), // URL slug (e.g., "gaming-dao", "art-collective")
  email: text('email').notNull().unique(), // Contact email
  status: text('status').notNull().default('active'), // active, suspended, deleted

  // Branding
  logoUrl: text('logo_url'),
  description: text('description'),
  website: text('website'),

  // Configuration
  config: jsonb('config').default({
    // Theme, features, limits, etc.
    features: {
      realTimeActivity: true,
      recommendations: true,
      gamification: true,
      marketplace: true,
      fiatOnramp: true,
      creator_tools: true,
      community: true,
      analytics: true,
    },
    customization: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      theme: 'light', // light, dark
    },
    limits: {
      maxUsers: 10000,
      maxNFTs: 100000,
      maxCollections: 1000,
    },
  }),

  // Subscription info
  planId: text('plan_id').notNull().default('starter'), // starter, pro, enterprise
  monthlyRevenueCut: integer('monthly_revenue_cut').default(20), // % of transaction fees
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * API Keys for SaaS tenant authentication
 */
export const tenantApiKeys = pgTable('saas_tenant_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "Production Key", "Development Key"
  key: varchar('key', { length: 255 }).notNull().unique(), // hashed API key
  keyPreview: varchar('key_preview', { length: 8 }).notNull(), // Show last 8 chars

  // Permissions
  permissions: jsonb('permissions').default([
    'read:nfts',
    'read:collections',
    'read:users',
    'read:analytics',
  ]),

  // Rate limiting
  rateLimit: integer('rate_limit').default(1000), // requests per hour

  // Metadata
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Usage tracking for billing & rate limiting
 */
export const tenantUsage = pgTable('saas_tenant_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  // Current billing period
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),

  // Metrics
  apiCallsCount: integer('api_calls_count').default(0),
  nftCreatedCount: integer('nft_created_count').default(0),
  usersCount: integer('users_count').default(0),
  transactionVolume: integer('transaction_volume').default(0), // in basis points (1 = 0.01%)

  // Usage costs (for overage billing)
  overageCharge: integer('overage_charge').default(0), // in cents

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant users - Users created within a tenant's marketplace
 */
export const tenantUsers = pgTable('saas_tenant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  email: text('email'),
  username: varchar('username', { length: 255 }),

  // User profile
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),

  // Status
  status: text('status').notNull().default('active'), // active, banned, inactive
  role: text('role').notNull().default('user'), // user, moderator, admin

  // Verification
  isVerified: boolean('is_verified').default(false),
  verificationTier: text('verification_tier').default('none'), // none, bronze, silver, gold

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant NFTs - NFTs within a tenant's marketplace
 */
export const tenantNFTs = pgTable('saas_tenant_nfts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  mint: varchar('mint', { length: 255 }).notNull().unique(), // Solana mint address
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),

  // Creator
  creatorId: uuid('creator_id').references(() => tenantUsers.id),

  // Marketplace data
  floorPrice: integer('floor_price'), // in lamports
  volume24h: integer('volume_24h'),
  views: integer('views').default(0),
  favorites: integer('favorites').default(0),

  // Status
  status: text('status').notNull().default('active'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tenant Collections
 */
export const tenantCollections = pgTable('saas_tenant_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),

  // Creator
  creatorId: uuid('creator_id').references(() => tenantUsers.id),

  // Stats
  nftCount: integer('nft_count').default(0),
  volume: integer('volume').default(0),
  floorPrice: integer('floor_price'),

  status: text('status').notNull().default('active'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * API Request logs for debugging & usage tracking
 */
export const apiRequestLogs = pgTable('saas_api_request_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code').notNull(),

  // Performance
  responseTimeMs: integer('response_time_ms'),

  // Request info
  userIp: varchar('user_ip', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Webhooks configuration for tenants
 */
export const tenantWebhooks = pgTable('saas_tenant_webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  url: text('url').notNull(), // Webhook destination URL

  // Events to subscribe to
  events: jsonb('events').default([
    'nft.created',
    'nft.sold',
    'user.registered',
    'offer.made',
  ]),

  status: text('status').notNull().default('active'),
  isActive: boolean('is_active').default(true),

  // Retry config
  retryCount: integer('retry_count').default(3),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Admin accounts for managing multiple tenants
 */
export const adminAccounts = pgTable('saas_admin_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),

  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  // Admin role
  role: text('role').notNull().default('admin'), // admin, superadmin

  // Permissions
  permissions: jsonb('permissions').default([
    'read:tenants',
    'manage:tenants',
    'manage:billing',
    'manage:support',
  ]),

  status: text('status').notNull().default('active'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Support tickets for SaaS customers
 */
export const supportTickets = pgTable('saas_support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  subject: text('subject').notNull(),
  description: text('description').notNull(),

  // Metadata
  priority: text('priority').notNull().default('normal'), // low, normal, high, urgent
  status: text('status').notNull().default('open'), // open, in_progress, resolved, closed

  // Assignment
  assignedToAdminId: uuid('assigned_to_admin_id').references(() => adminAccounts.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

/**
 * Billing invoices for SaaS subscriptions
 */
export const billingInvoices = pgTable('saas_billing_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  invoiceNumber: varchar('invoice_number', { length: 255 }).notNull().unique(),

  // Amounts (in cents)
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').notNull(),
  total: integer('total').notNull(),

  // Breakdown
  lineItems: jsonb('line_items').default([]), // subscription fee, overages, etc.

  // Status
  status: text('status').notNull().default('draft'), // draft, sent, paid, overdue, cancelled
  paidAt: timestamp('paid_at'),

  // Dates
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
  dueDate: timestamp('due_date').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type TenantInsert = typeof tenants.$inferInsert;
export type TenantApiKey = typeof tenantApiKeys.$inferSelect;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type TenantNFT = typeof tenantNFTs.$inferSelect;
export type TenantCollection = typeof tenantCollections.$inferSelect;
