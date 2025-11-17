# NFTSol - How to View & Test the App Locally

**This guide will help you run the full application locally and see everything as a user would.**

---

## 📋 Prerequisites

Before starting, make sure you have:
- Node.js v18+ installed
- npm or yarn
- A running PostgreSQL database (or use mock data for testing)
- A Solana wallet (Phantom, Ledger, etc.) for testing

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# From project root
cd /c/Users/KHK89/NFTSol

# Install all dependencies
npm run install:all

# Or individually:
npm ci --ignore-scripts
cd client && npm ci && cd ..
cd apps/backend && npm ci && cd ../..
```

### Step 2: Set Up Environment Variables

**Backend** (apps/backend/.env):
```env
# Already configured in repository
NODE_ENV=development
PORT=3001
VITE_CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Optional (for specific features)
STRIPE_SECRET_KEY=your_key_here
MOONPAY_SECRET_KEY=your_key_here
```

**Frontend** (client/.env):
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### Step 3: Start Backend

Open Terminal 1:
```bash
cd /c/Users/KHK89/NFTSol
npm run dev
```

Expected output:
```
Server running on http://localhost:3001
✅ WebSocket server initialized
✅ Database connected
✅ All services initialized
```

### Step 4: Start Frontend

Open Terminal 2:
```bash
cd /c/Users/KHK89/NFTSol/client
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 5: Open in Browser

Visit: **http://localhost:5173**

---

## 🎯 What You'll See

### Homepage
- NFT marketplace overview
- Featured collections
- Real-time activity feed (if WebSocket connected)
- User navigation menu

### Key Pages to Explore

1. **Dashboard** (`/dashboard`)
   - Your profile
   - Your NFTs
   - Your offers
   - Analytics (if creator)

2. **Marketplace** (`/marketplace`)
   - Browse NFTs
   - Filter by collection, price, rarity
   - Search functionality
   - Real-time activity

3. **Create** (`/create` or `/mint`)
   - Mint new NFTs
   - Set metadata
   - Upload images
   - Configure royalties

4. **Portfolio** (`/portfolio`)
   - Your owned NFTs
   - Trading history
   - Statistics
   - Activity

5. **Collections** (`/collections`)
   - Browse collections
   - Create collection
   - Manage items

---

## 🔑 Testing with SaaS API (New Feature!)

### Test Tenant Creation

```bash
# In a third terminal, create a test tenant
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Gaming DAO",
    "slug": "test-gaming-dao",
    "email": "admin@test.com"
  }'

# Save the API key returned
export TENANT_API_KEY="sk_test_..."
```

### Test SaaS APIs

```bash
# Health check
curl http://localhost:3001/saas/health \
  -H "Authorization: Bearer $TENANT_API_KEY"

# Get tenant details
curl http://localhost:3001/saas/tenant \
  -H "Authorization: Bearer $TENANT_API_KEY"

# Create new API key
curl -X POST http://localhost:3001/saas/api-keys \
  -H "Authorization: Bearer $TENANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mobile App", "permissions": ["read:nfts"]}'
```

---

## 🧪 Testing User Flows

### Flow 1: Browse Marketplace

1. Go to `http://localhost:5173`
2. Click "Marketplace" or "Browse"
3. Filter by:
   - Collection
   - Price range
   - Rarity
   - Status (listed, sold, etc.)
4. Click on an NFT to see details
5. Observe real-time activity (if enabled)

### Flow 2: Connect Wallet & View Portfolio

1. Click "Connect Wallet" (top right)
2. Select a wallet provider (Phantom, etc.)
3. Approve connection
4. Go to "Portfolio" or "Dashboard"
5. See your NFTs and stats
6. View your transaction history

### Flow 3: Make an Offer

1. Find an NFT you like
2. Click "Make Offer"
3. Enter offer amount
4. Set expiration
5. Submit offer
6. See pending offers in "Offers" tab

### Flow 4: List an NFT for Sale

1. Go to "Portfolio"
2. Find your NFT
3. Click "List for Sale"
4. Choose listing type:
   - Fixed price
   - Auction
   - Bundle
5. Set price and duration
6. Confirm transaction

### Flow 5: Create & Mint NFT

1. Go to "Create" or "Mint"
2. Upload image
3. Enter metadata:
   - Name
   - Description
   - Attributes
   - Royalties
4. Review
5. Mint (this will cost SOL on mainnet, use devnet for testing)

### Flow 6: View Creator Dashboard

1. Go to "Creator Tools" or similar
2. See your stats:
   - Total volume
   - Royalties earned
   - Floor price
   - Trending items
3. Manage royalty splits
4. Create metadata templates

### Flow 7: Join Community

1. Go to "Community" or "Social"
2. Browse user profiles
3. Follow creators
4. Join collections
5. Send messages
6. Create curated lists

---

## 📊 Testing Analytics Features

### Real-Time Activity Feed
```
Should show:
- NFT listings (created, listed, sold)
- User actions (followed, made offer, etc.)
- Price changes
- Live updates via WebSocket
```

### Gamification
```
Look for:
- Achievement badges
- Points/level system
- Leaderboards
- Daily login streak
```

### Rarity Scoring
```
Should see:
- Rarity percentage
- Trait analysis
- Rarity ranking
- Price correlation
```

---

## 🐛 Troubleshooting

### "Connection refused" error
```
Solution:
1. Check if backend is running: npm run dev
2. Verify PORT=3001 in .env
3. Check firewall isn't blocking port 3001
```

### Frontend can't reach backend
```
Solution:
1. Check VITE_API_URL=http://localhost:3001
2. Verify CORS is enabled in backend
3. Check backend console for errors
```

### Database connection error
```
Solution:
1. Make sure PostgreSQL is running
2. Check DATABASE_URL is correct
3. Run: npm run db:migrate
```

### Wallet won't connect
```
Solution:
1. Install Phantom or other wallet extension
2. Create test wallet on devnet
3. Request devnet SOL from faucet
4. Check browser console for errors
```

### WebSocket not connecting
```
Solution:
1. Check backend is running
2. Verify WS_URL in frontend env
3. Check if port 3001 is open
4. Look for errors in browser Network tab
```

---

## 📁 Important Directories

```
/c/Users/KHK89/NFTSol/
├── apps/
│   └── backend/        # Express API server
│       ├── src/
│       │   ├── index.ts          # Main server
│       │   ├── routes/           # API endpoints
│       │   ├── services/         # Business logic
│       │   ├── db/               # Database
│       │   └── middleware/       # Auth, etc
│       └── package.json
│
├── client/             # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   └── package.json
│
└── package.json        # Root scripts
```

---

## 🔗 Useful URLs

When running locally:

**Frontend**: http://localhost:5173
**Backend API**: http://localhost:3001
**API Docs**: http://localhost:3001/api/docs (if implemented)

---

## 🧪 Testing Checklist

As you explore, test these:

### Core Features
- [ ] Homepage loads
- [ ] Marketplace displays NFTs
- [ ] Can filter/search
- [ ] Wallet connects
- [ ] Portfolio shows your NFTs
- [ ] Can view NFT details

### User Actions
- [ ] Can make offers
- [ ] Can list NFTs
- [ ] Can create collections
- [ ] Can follow users
- [ ] Can message users
- [ ] Can create/edit profile

### Real-Time Features
- [ ] Activity feed updates live
- [ ] Price changes show instantly
- [ ] New listings appear immediately
- [ ] Notifications update in real-time

### Creator Features
- [ ] Can mint NFTs
- [ ] Can set royalties
- [ ] Can see analytics
- [ ] Can verify account
- [ ] Can create templates

### Admin Features (if logged in as admin)
- [ ] Can see platform stats
- [ ] Can manage users
- [ ] Can view revenue
- [ ] Can suspend accounts
- [ ] Can create collections

---

## 💾 Database Setup

If you need to reset the database:

```bash
# Drop and recreate
npm run db:reset

# Or run migrations
npm run db:migrate

# Or seed with test data
npm run db:seed
```

---

## 📈 Monitoring

### Check Backend Health
```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "status": "ok",
  "uptime": 1234,
  "database": "connected"
}
```

### Check API Response Times
```bash
# Frontend dev tools → Network tab
# Look for response times
# Should be < 100ms for most endpoints
```

### Monitor WebSocket Connection
```javascript
// In browser console
localStorage.debug = 'socket.io*'
// Then refresh and check console
```

---

## 🚀 What to Look For

### Performance
- Does the marketplace load quickly?
- Are images loading properly?
- Is the activity feed updating in real-time?
- Are filters responsive?

### User Experience
- Is navigation intuitive?
- Are buttons where you'd expect them?
- Is the layout mobile-friendly?
- Are error messages clear?

### Features Working
- Can you complete all user flows?
- Are all buttons functional?
- Are all pages accessible?
- Is data persisting?

### Visual Polish
- Does the design look professional?
- Are colors consistent?
- Is typography readable?
- Are spacing and alignment correct?

---

## 📝 Notes

- **Devnet Testing**: Use devnet Solana for cheaper testing
- **Test Wallets**: Create multiple wallets to test interactions
- **Mock Data**: Some features may use mock data in dev mode
- **Feature Flags**: Some features may be behind feature flags
- **Errors**: Check browser console (F12) and server logs for errors

---

## 🎯 Next Steps After Viewing

After you explore the app:

1. **Document what works**
   - List all working features
   - Note performance issues
   - Identify missing features

2. **Identify gaps**
   - What's not implemented?
   - What needs improvement?
   - What's buggy?

3. **Prioritize**
   - What's critical?
   - What's nice-to-have?
   - What's broken?

4. **Plan Phase 2**
   - Build missing pieces
   - Fix bugs
   - Improve UX

---

## 💬 Questions?

If something isn't working:
1. Check server logs: `npm run dev`
2. Check browser console: F12
3. Check network tab for failed requests
4. Check .env files are correct
5. Verify all dependencies installed

---

**Ready to explore?** 🚀 Start with `npm run dev` and open http://localhost:5173!
