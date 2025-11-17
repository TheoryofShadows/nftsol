# NFTSol 2026 Features - Integration Guide

## 🔧 Quick Integration Steps

### Step 1: Import All Services

Add to `apps/backend/src/index.ts`:

```typescript
// Import services
import { initializeWebSocket, getWebSocketService } from './services/websocket.service';
import { initializeRecommendationService } from './services/recommendation.service';
import { initializeGamificationService } from './services/gamification.service';
import { initializeAdvancedMarketplaceService } from './services/advanced-marketplace.service';
import { initializeFiatOnrampService } from './services/fiat-onramp.service';
import { initializeCreatorToolsService } from './services/creator-tools.service';

// Import routes
import activityFeedRoutes from './routes/activity-feed';
import recommendationRoutes from './routes/recommendations';
import gamificationRoutes from './routes/gamification';
import advancedMarketplaceRoutes from './routes/advanced-marketplace';
import fiatOnrampRoutes from './routes/fiat-onramp';
import creatorToolsRoutes from './routes/creator-tools';
```

### Step 2: Initialize Services

```typescript
// After creating Express app and HTTP server:
const wsService = initializeWebSocket(server);
initializeRecommendationService();
initializeGamificationService();
initializeAdvancedMarketplaceService();
initializeFiatOnrampService();
initializeCreatorToolsService();

console.log('✅ All services initialized');
```

### Step 3: Register Routes

```typescript
// Add these before app.listen()
app.use('/api/v1/activity', activityFeedRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/marketplace', advancedMarketplaceRoutes);
app.use('/api/v1/fiat', fiatOnrampRoutes);
app.use('/api/v1/creators', creatorToolsRoutes);

console.log('✅ All routes registered');
```

### Step 4: Environment Variables

Add to `.env` file:

```env
# WebSocket
VITE_CLIENT_URL=http://localhost:5173

# Fiat Onramp
STRIPE_SECRET_KEY=sk_test_your_key_here
MOONPAY_SECRET_KEY=your_moonpay_key
ALCHEMY_PAY_SECRET_KEY=your_alchemy_key

# Optional: Sentry for error tracking
SENTRY_DSN=https://your_sentry_dsn
```

### Step 5: Frontend Integration

Update `client/src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  useEffect(() => {
    // Connect to WebSocket
    const socket = io(import.meta.env.VITE_API_BASE, {
      query: { userId: localStorage.getItem('userId') }
    });

    // Listen for real-time updates
    socket.on('activity:new', (event) => {
      console.log('New activity:', event);
      // Update UI
    });

    return () => socket.disconnect();
  }, []);

  return (
    // Your app JSX
    <>
      {/* Add new components for features */}
      <RecommendationWidget />
      <GameificationDisplay />
      <CreatorDashboard />
    </>
  );
}
```

---

## 🎮 Component Integration Examples

### 1. Display Recommendations

```typescript
// In any component
import { useQuery } from 'react-query';

function RecommendationWidget() {
  const { data: recommendations } = useQuery('recommendations', () =>
    fetch('/api/v1/recommendations/personalized').then(r => r.json())
  );

  return (
    <div>
      <h3>Recommended for You</h3>
      {recommendations?.data.map(rec => (
        <div key={rec.mint}>
          <h4>{rec.mint}</h4>
          <p>Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
          <p>{rec.explanation}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Display Achievements

```typescript
function AchievementsPanel() {
  const { data: userAchievements } = useQuery('achievements', () =>
    fetch('/api/v1/gamification/user-achievements').then(r => r.json())
  );

  return (
    <div>
      <h3>Your Achievements ({userAchievements?.achievements.length})</h3>
      <p>Level: {userAchievements?.level}</p>
      <p>Points: {userAchievements?.totalPoints}</p>
      <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '8px' }}>
        <div
          style={{
            width: `${userAchievements?.levelProgress}%`,
            backgroundColor: '#4caf50',
            height: '8px',
            borderRadius: '8px',
            transition: 'width 0.3s'
          }}
        />
      </div>
      <div className="achievements-grid">
        {userAchievements?.achievements.map(ach => (
          <div key={ach.id} className="achievement-badge">
            <span>{ach.icon}</span>
            <h5>{ach.name}</h5>
            <p>{ach.points} pts</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Create Auction Listing

```typescript
async function createAuction(nftMint, startPrice, durationHours) {
  const response = await fetch('/api/v1/marketplace/listings/auction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nftMint,
      startPrice,
      durationHours,
      minIncrementPercentage: 5
    })
  });
  return response.json();
}
```

### 4. Enable Fiat Onramp

```typescript
async function setupFiatOnramp(amount, walletAddress) {
  const response = await fetch('/api/v1/fiat/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'stripe', // or 'moonpay', 'alchemy_pay'
      amount,
      currency: 'USD',
      walletAddress,
      cryptoCurrency: 'SOL'
    })
  });
  return response.json();
}
```

### 5. Creator Profile Setup

```typescript
async function setupCreatorProfile(bio, website) {
  const response = await fetch('/api/v1/creators/profile/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const profile = await response.json();

  // Update profile
  const updateResponse = await fetch('/api/v1/creators/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio, website })
  });

  return updateResponse.json();
}
```

---

## 📱 Real-Time Updates with WebSocket

### Listen to Activity Feed

```typescript
socket.on('activity:new', (event) => {
  switch (event.type) {
    case 'nft_created':
      console.log('New NFT created:', event.data);
      break;
    case 'nft_sold':
      console.log('NFT sold:', event.data);
      break;
    case 'offer_made':
      console.log('New offer:', event.data);
      break;
  }
});
```

### Subscribe to NFT Updates

```typescript
// Subscribe to specific NFT
socket.emit('subscribe:nft', nftMint);

// Listen for updates
socket.on(`nft:${nftMint}:update`, (event) => {
  // Update NFT details in real-time
});

// Unsubscribe when done
socket.emit('unsubscribe:nft', nftMint);
```

### Subscribe to Collection Updates

```typescript
socket.emit('subscribe:collection', collectionId);
socket.on(`collection:${collectionId}:update`, (event) => {
  // Handle collection updates
});
```

---

## 🧪 Testing Integration

### Test WebSocket Connection

```bash
npm run test -- websocket.service.test.ts
```

### Test Recommendation Engine

```bash
# Create test user profile
curl -X POST http://localhost:3000/api/v1/recommendations/track \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "nft_viewed",
    "nftMint": "TEST123"
  }'

# Get recommendations
curl http://localhost:3000/api/v1/recommendations/personalized \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Marketplace Auctions

```bash
# Create auction
curl -X POST http://localhost:3000/api/v1/marketplace/listings/auction \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nftMint": "abc123",
    "startPrice": 5,
    "durationHours": 48
  }'

# Place bid
curl -X POST http://localhost:3000/api/v1/marketplace/auctions/AUCTION_ID/bid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "amount": 10 }'
```

---

## 🔍 Debugging Tips

### Enable Service Logging

Add to `createLogger` calls:

```typescript
const logger = createLogger('websocket-service', { level: 'debug' });
```

### Check WebSocket Health

```typescript
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', () => console.log('❌ Disconnected'));
socket.on('error', (error) => console.error('⚠️ Error:', error));

// Send heartbeat
setInterval(() => socket.emit('ping'), 30000);
socket.on('pong', () => console.log('💓 Connection alive'));
```

### Monitor API Calls

```typescript
// Add to routes for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

---

## 📊 Database Setup

Run migrations for new tables:

```bash
npm run db:migrate

# Or manually create:
psql $DATABASE_URL < ./migrations/create_listings_table.sql
psql $DATABASE_URL < ./migrations/create_creator_profiles.sql
psql $DATABASE_URL < ./migrations/create_achievements.sql
```

---

## 🚨 Common Issues & Solutions

### WebSocket Connection Failed
```
Issue: CORS error on WebSocket
Solution: Check VITE_CLIENT_URL env var matches your frontend URL
```

### Recommendation Engine Returns Empty
```
Issue: No recommendations generated
Solution: User needs interaction history (view, favorite, purchase)
Workaround: Return trending NFTs as fallback
```

### Fiat Onramp Not Working
```
Issue: Payment provider keys not configured
Solution: Add STRIPE_SECRET_KEY, MOONPAY_SECRET_KEY to .env
```

### Royalty Distribution Failing
```
Issue: Recipient percentages don't sum to 100%
Solution: Validate in frontend before calling API
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] WebSocket connects without errors
- [ ] Real-time activity updates appear in console
- [ ] Recommendations endpoint returns suggestions
- [ ] Gamification routes accessible
- [ ] Marketplace auctions can be created
- [ ] Fiat onramp providers listed
- [ ] Creator profile can be initialized
- [ ] All environment variables set
- [ ] Database tables created
- [ ] No TypeScript compilation errors
- [ ] Tests passing

---

## 🎯 Next Steps

1. **Integrate frontend components** (2-3 days)
2. **Connect to database** (1-2 days)
3. **Test all endpoints** (1 day)
4. **Setup error monitoring** (Sentry)
5. **Deploy to staging** for testing
6. **Gather user feedback**
7. **Implement remaining 20 features**

---

## 📚 Additional Resources

- Service implementations: `apps/backend/src/services/`
- Route definitions: `apps/backend/src/routes/`
- Type definitions: `shared/types/`
- API documentation: `2026_MARKETPLACE_ENHANCEMENT.md`

**Questions?** Check the service file comments - they have detailed explanations of every method.

Good luck! 🚀
