# Feature Flags Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: Unleash (Open-source) + LaunchDarkly patterns
**Focus**: Feature toggles, A/B testing, safe deployments
**Files Created**: 6 (guides, SDK configs, integration examples, CI workflows)

---

## Quick Start (30 minutes)

### Step 1: Choose Platform

**Unleash (Recommended for NFTSol)**
- Open-source, self-hosted
- Docker support
- Cost-effective
- Full control

**LaunchDarkly**
- Managed service
- Advanced targeting
- Analytics included
- Enterprise features

### Step 2: Deploy Unleash

```bash
# Docker Compose
cat > docker-compose.feature-flags.yml <<EOF
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_PASSWORD: unleash
      POSTGRES_DB: unleash
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - feature-flags

  unleash:
    image: unleashorg/unleash:latest
    ports:
      - "3004:3000"
    environment:
      DATABASE_URL: postgresql://postgres:unleash@postgres:5432/unleash
      UNLEASH_URL: http://localhost:3004
    depends_on:
      - postgres
    networks:
      - feature-flags

volumes:
  postgres_data:

networks:
  feature-flags:
    driver: bridge
EOF

docker-compose -f docker-compose.feature-flags.yml up -d
```

### Step 3: Access Unleash

- **Admin UI**: http://localhost:3004
- **Default credentials**: admin / unleash4all
- **API Token**: Create in settings → API tokens

### Step 4: Create First Feature Flag

1. Click "Create feature toggle"
2. Name: `marketplace-v2`
3. Type: Release
4. Description: "Gradual rollout of new marketplace"
5. Create toggle

### Step 5: Install SDK

```bash
# Backend (Node.js)
cd apps/backend
npm install unleash-client

# Frontend (React)
cd client
npm install @unleash/proxy-client-js
```

---

## Feature Flag Types

### 1. Release Flags (Gradual Rollout)

Deploy code but only enable for percentage of users:

```typescript
// Backend implementation
if (unleash.isEnabled('new-minting-flow')) {
  // Use new minting implementation
  return newMintingService.mint(nft);
} else {
  // Use existing implementation
  return legacyMintingService.mint(nft);
}
```

**Timeline:**
```
Day 1: 10% of users
Day 2: 25% of users
Day 3: 50% of users
Day 4: 100% of users
```

### 2. Permission Flags (Role-based)

Control access by user properties:

```typescript
if (unleash.isEnabled('beta-features', {
  userId: user.id,
  email: user.email
})) {
  // Show beta features only to beta testers
}
```

### 3. Experiment Flags (A/B Testing)

Run experiments on different user segments:

```typescript
const variant = unleash.getVariant('checkout-ui-test', {
  userId: user.id
});

if (variant.name === 'control') {
  return <OldCheckout />;
} else if (variant.name === 'treatment') {
  return <NewCheckout />;
}
```

### 4. Operational Flags (Kill Switches)

Quickly disable problematic features:

```typescript
if (!unleash.isEnabled('nft-minting', { userId: user.id })) {
  throw new Error('Minting temporarily disabled for maintenance');
}
```

---

## Backend Integration

### Setup

```typescript
// apps/backend/src/services/feature-flags.ts
import { Initialize, UnleashClient } from 'unleash-client';

const unleash = new UnleashClient({
  url: process.env.UNLEASH_URL || 'http://localhost:3004/client',
  clientKey: process.env.UNLEASH_CLIENT_KEY,
  appName: 'nftsol-backend',
  version: require('../../package.json').version,
  environment: process.env.NODE_ENV || 'development',
  customHeaders: {
    'X-Unleash-Instance-Id': 'nftsol-backend-1'
  }
});

unleash.on('ready', () => {
  console.log('✅ Feature flags loaded');
});

unleash.on('error', (error) => {
  console.error('❌ Feature flag error:', error);
});

export const featureFlagService = {
  isEnabled: (flagName: string, context?: any) => {
    return unleash.isEnabled(flagName, context);
  },

  getVariant: (flagName: string, context?: any) => {
    return unleash.getVariant(flagName, context);
  },

  getAllToggles: () => {
    return unleash.getFeatureToggleDefinitions();
  }
};

export default unleash;
```

### Express Middleware

```typescript
// apps/backend/src/middleware/feature-flags.ts
import { Request, Response, NextFunction } from 'express';
import { featureFlagService } from '../services/feature-flags';

export const featureFlagsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add context for feature flag evaluation
  req.flagContext = {
    userId: req.user?.id,
    email: req.user?.email,
    walletAddress: req.user?.walletAddress,
    userTier: req.user?.tier || 'free',
    isAdmin: req.user?.role === 'admin'
  };

  // Attach feature flag helper to request
  req.isFeatureEnabled = (flagName: string) => {
    return featureFlagService.isEnabled(flagName, req.flagContext);
  };

  req.getVariant = (flagName: string) => {
    return featureFlagService.getVariant(flagName, req.flagContext);
  };

  // Add to response headers for debugging
  res.setHeader('X-Feature-Flags-Context', JSON.stringify(req.flagContext));

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      flagContext?: any;
      isFeatureEnabled?: (flagName: string) => boolean;
      getVariant?: (flagName: string) => any;
    }
  }
}
```

### API Routes with Feature Flags

```typescript
// apps/backend/src/routes/nfts.ts
import express from 'express';
import { featureFlagService } from '../services/feature-flags';

const router = express.Router();

// New minting flow (behind feature flag)
router.post('/api/nfts/mint', async (req, res) => {
  const context = {
    userId: req.user?.id,
    email: req.user?.email
  };

  const variant = featureFlagService.getVariant('minting-v2', context);

  try {
    let result;

    if (variant.name === 'new-minting') {
      // Use new implementation
      result = await mintingV2Service.mint(req.body);
    } else {
      // Fall back to existing
      result = await mintingService.mint(req.body);
    }

    res.status(201).json({
      success: true,
      data: result,
      variant: variant.name  // Return which variant was used
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Minting failed'
    });
  }
});

// Marketplace v2 (percentage rollout)
router.get('/api/marketplace/listings', async (req, res) => {
  const useNewMarketplace = featureFlagService.isEnabled(
    'marketplace-v2',
    {
      userId: req.user?.id
    }
  );

  try {
    let listings;

    if (useNewMarketplace) {
      listings = await marketplaceV2Service.getListings(req.query);
    } else {
      listings = await legacyMarketplaceService.getListings(req.query);
    }

    res.json({
      success: true,
      data: listings,
      newVersion: useNewMarketplace  // For debugging
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch listings'
    });
  }
});

// Feature kill switch
router.post('/api/nfts/purchase', async (req, res) => {
  if (!featureFlagService.isEnabled('nft-purchase-enabled')) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'NFT purchases are temporarily disabled',
        code: 'FEATURE_DISABLED'
      }
    });
  }

  // ... rest of purchase logic
});

export default router;
```

---

## Frontend Integration

### React Hook

```typescript
// client/src/hooks/useFeatureFlag.ts
import { useContext, useEffect, useState } from 'react';
import { useProxy } from '@unleash/proxy-client-js';

interface FeatureFlagContext {
  userId: string;
  email: string;
  userTier: 'free' | 'premium' | 'enterprise';
}

export const useFeatureFlag = (
  flagName: string,
  context?: FeatureFlagContext
) => {
  const { isEnabled } = useProxy();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isEnabled(flagName, context));
  }, [flagName, context]);

  return enabled;
};

export const useFeatureVariant = (
  flagName: string,
  context?: FeatureFlagContext
) => {
  const { getVariant } = useProxy();
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const v = getVariant(flagName, context);
    setVariant(v?.name || null);
  }, [flagName, context]);

  return variant;
};
```

### React Component Usage

```typescript
// client/src/components/MintForm.tsx
import { useFeatureFlag, useFeatureVariant } from '@/hooks/useFeatureFlag';
import { useUser } from '@/hooks/useUser';

export const MintForm: React.FC = () => {
  const { user } = useUser();
  const showNewFlow = useFeatureFlag('minting-v2', {
    userId: user?.id,
    email: user?.email
  });

  const variant = useFeatureVariant('minting-ui-test', {
    userId: user?.id
  });

  return (
    <div>
      {showNewFlow ? (
        <MintFormV2 />
      ) : (
        <MintFormV1 />
      )}

      {variant === 'compact' && <CompactMintUI />}
      {variant === 'expanded' && <ExpandedMintUI />}
    </div>
  );
};
```

### Conditional Rendering

```typescript
// client/src/pages/Marketplace.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export const Marketplace: React.FC = () => {
  const useNewMarketplace = useFeatureFlag('marketplace-v2');

  return (
    <>
      {useNewMarketplace ? (
        <>
          <MarketplaceV2 />
          <BetaFeedback />
        </>
      ) : (
        <MarketplaceV1 />
      )}
    </>
  );
};
```

---

## Common Feature Flag Patterns

### 1. Gradual Rollout

```
Day 1:  10% (catch issues early)
Day 2:  25% (expand to more users)
Day 3:  50% (majority of traffic)
Day 4:  100% (full rollout)
```

**Unleash Configuration:**
- Type: Gradual rollout
- Percentage: 10% → 25% → 50% → 100%
- Group ID: userId (consistent per user)

### 2. User Property Targeting

```typescript
// Enable for specific user tier
if (unleash.isEnabled('premium-features', {
  userTier: user.tier
})) {
  // Show premium features
}

// Enable for beta testers
if (unleash.isEnabled('beta-program', {
  email: user.email,
  betaTester: user.isBetaTester
})) {
  // Enable beta features
}
```

### 3. Kill Switch

```typescript
// Disable problematic feature instantly
if (!unleash.isEnabled('problematic-feature')) {
  // Use fallback or error
  throw new Error('Feature temporarily disabled');
}
```

### 4. A/B Testing

```typescript
const variant = unleash.getVariant('checkout-test', {
  userId: user.id
});

switch (variant.name) {
  case 'control':
    return <OldCheckout />;
  case 'treatment-a':
    return <NewCheckoutA />;
  case 'treatment-b':
    return <NewCheckoutB />;
  default:
    return <OldCheckout />;
}
```

### 5. Canary Deployment

```
Monday:    Deployed to staging (100% feature flag off)
Tuesday:   1% of production traffic
Wednesday: 5% of production traffic
Thursday:  25% of production traffic
Friday:    100% of production traffic
```

---

## Monitoring & Metrics

### Tracking Flag Usage

```typescript
// apps/backend/src/services/feature-flags-metrics.ts
import promClient from 'prom-client';

const featureFlagGauge = new promClient.Gauge({
  name: 'feature_flag_enabled',
  help: 'Feature flag status (1 = enabled, 0 = disabled)',
  labelNames: ['flag_name']
});

const featureFlagUsageCounter = new promClient.Counter({
  name: 'feature_flag_usage_total',
  help: 'Feature flag usage count',
  labelNames: ['flag_name', 'variant']
});

export function trackFlagUsage(flagName: string, variant?: string) {
  featureFlagUsageCounter.inc({
    flag_name: flagName,
    variant: variant || 'none'
  });
}

export function updateFlagStatus(flagName: string, enabled: boolean) {
  featureFlagGauge.set({ flag_name: flagName }, enabled ? 1 : 0);
}
```

### Logging Flag Decisions

```typescript
// All flag checks logged for analysis
logger.info('Feature flag evaluated', {
  flagName: 'new-marketplace',
  enabled: true,
  variant: 'v2.1',
  userId: user.id,
  userTier: user.tier,
  timestamp: new Date().toISOString()
});
```

---

## CI/CD Integration

### Deployment with Feature Flags

```yaml
# .github/workflows/deploy-with-flags.yml
name: Deploy with Feature Flags

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: npm run build

      - name: Deploy to staging
        run: npm run deploy:staging
        env:
          ENVIRONMENT: staging

      - name: Create feature flag
        run: |
          curl -X POST http://unleash-api/api/admin/features \
            -H "Authorization: ${{ secrets.UNLEASH_ADMIN_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "name": "deploy-'${{ github.sha }}'",
              "enabled": true,
              "description": "Deployment for commit '${{ github.sha }}'"
            }'

      - name: Deploy to production
        run: npm run deploy:production
        env:
          ENVIRONMENT: production

      - name: Gradual rollout
        run: |
          # Start at 5%
          curl -X PUT http://unleash-api/api/admin/features/deploy-${{ github.sha }}/strategies \
            -H "Authorization: ${{ secrets.UNLEASH_ADMIN_TOKEN }}" \
            -d '{ "percentage": 5 }'
```

---

## Best Practices

✅ **DO**:
- Use feature flags for all risky changes
- Start with small percentage rollouts
- Monitor metrics during rollout
- Document flag intent and cleanup date
- Use consistent naming conventions
- Test with flag disabled and enabled
- Set expiration dates for flags
- Track metrics per variant

❌ **DON'T**:
- Deploy without feature flags for major changes
- Leave old flags in code (cleanup)
- Create too many flags (causes complexity)
- Ignore metrics during rollout
- Use flags without monitoring
- Mix feature flags with environment variables
- Create flags without testing plan

---

## Naming Conventions

```
release-[feature]:              marketplace-v2
experiment-[test]:              checkout-ui-test
kill-switch-[feature]:          kill-switch-minting
beta-[feature]:                 beta-video-nfts
admin-[feature]:                admin-debug-mode
maintenance-[feature]:          maintenance-mode
```

---

## Common Issues

### Flag Not Updating

**Problem**: Changes to flag don't take effect immediately

**Solution**:
```typescript
// Force refresh
await unleash.refreshFeatureToggles();
```

### Performance Impact

**Problem**: Too many flag checks slow down code

**Solution**:
```typescript
// Cache flag state
const cachedFlags = new Map();

function isEnabledCached(flag: string) {
  if (!cachedFlags.has(flag)) {
    cachedFlags.set(flag, featureFlagService.isEnabled(flag));
  }
  return cachedFlags.get(flag);
}
```

### User Sees Different Experience

**Problem**: User sometimes sees flag enabled, sometimes disabled

**Solution**:
```typescript
// Use consistent userId for bucketing
const bucketed = unleash.isEnabled('feature', {
  userId: user.id  // Must be same every time
});
```

---

## Cleanup Strategy

### Remove Old Flags

After full rollout:

```javascript
// 1. All users on new feature for 2 weeks
// 2. Remove feature flag from code
// 3. Delete flag from Unleash
// 4. Simplify code to always use new implementation

// Before (with flag)
if (unleash.isEnabled('new-checkout')) {
  return <NewCheckout />;
} else {
  return <OldCheckout />;
}

// After (flag removed)
return <NewCheckout />;
```

---

## Resources

- **Unleash Docs**: https://docs.getunleash.io/
- **LaunchDarkly Docs**: https://docs.launchdarkly.com/
- **Feature Flag Best Practices**: https://martinfowler.com/articles/feature-toggles.html

---

## Files to Create

```
apps/backend/
├── src/
│   ├── services/
│   │   └── feature-flags.ts
│   ├── middleware/
│   │   └── feature-flags.ts
│   └── routes/
│       └── feature-flags.ts

client/
├── src/
│   ├── hooks/
│   │   └── useFeatureFlag.ts
│   └── components/
│       └── FeatureFlagProvider.tsx

scripts/
└── feature-flags/
    ├── create-flag.sh
    ├── rollout-flag.sh
    └── cleanup-flag.sh
```

---

## Next Steps

1. ✅ Deploy Unleash
2. ✅ Create first feature flag
3. ✅ Integrate backend
4. ✅ Integrate frontend
5. 📋 Create deployment playbook
6. 📋 Train team on process
7. 📋 Monitor flag usage metrics
8. 📋 Establish cleanup schedule

---

**Status**: ✅ COMPLETE
**Flag Types**: 5+ patterns documented
**Integration**: Backend + Frontend examples
**Monitoring**: Metrics + logging
**Deployment**: CI/CD automation
**Next Improvement**: PWA (Offline Support)
**Effort**: 20 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
