# 🎬 Eternal Echoes - Quick Start Guide

## 🚀 Get Up and Running in 10 Minutes

### **Prerequisites**
- Node.js 18+
- Rust + Anchor 0.29.0
- Solana CLI
- PostgreSQL database
- Phantom/Solflare wallet

---

## **Step 1: Deploy Anchor Program (3 min)**

```bash
# Navigate to smart contracts
cd apps/smart-contracts/solana_rewards

# Build the program
anchor build

# Deploy to devnet
anchor deploy --program-name eternal_echoes --provider.cluster devnet

# ⚠️ IMPORTANT: Copy the Program ID from output
# Example: EtEcho1234...
```

**Update Program ID in 3 places:**
1. `programs/eternal_echoes/src/lib.rs` line 6
2. `apps/frontend/src/pages/EchoMint.tsx` line 76
3. `apps/smart-contracts/solana_rewards/Anchor.toml` (add to `[programs.devnet]`)

---

## **Step 2: Setup Backend (2 min)**

```bash
cd apps/backend

# Install dependencies (if not done)
npm install

# Setup environment
cp config/development/.env.example .env

# Edit .env - Add your DATABASE_URL
# DATABASE_URL=postgresql://user:pass@localhost:5432/nftsol

# Run migrations
npx drizzle-kit push:pg

# Start backend
npm run dev
```

Backend should now be running on `http://localhost:3001`

---

## **Step 3: Setup Frontend (2 min)**

```bash
cd apps/frontend

# Install dependencies (if not done)
npm install

# Setup environment
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

Frontend should now be running on `http://localhost:5173`

---

## **Step 4: Test the Flow (3 min)**

### **Mint Your First Echo:**

1. **Open Browser** → `http://localhost:5173`

2. **Navigate** → Click "🎬 Eternal Echoes" in nav bar

3. **Search** → Type "nasa apollo" or "moon landing"
   - Results will appear with thumbnails
   - Each has a verification teaser (mock data)

4. **Select** → Click on a search result
   - Preview section appears
   - Truth score badge shows (e.g., 95%)
   - Video player loads

5. **Connect Wallet** → Click wallet button (top right)
   - Connect Phantom/Solflare
   - Approve connection

6. **Mint** → Click "🚀 Mint Echo – CLOUT x2!"
   - Transaction will be sent to blockchain
   - Wait for confirmation (~2-3 seconds)
   - Toast notification shows success

7. **View** → (Currently manual)
   - Copy ledger PDA from console
   - Change URL to `/echo-viewer` tab
   - See your base echo (placeholder)

### **Add Your First Echo Layer:**

1. **In Viewer** → Click "✨ Add Your Echo"

2. **Select Type** → Choose Text/Audio/Annotation

3. **Write Content** → Add your commentary
   - Example: "This is a historic moment for humanity!"

4. **Submit** → Click "🚀 Add Echo"
   - Content gets verified by Grokipedia (mock)
   - Score calculated (0-100%)
   - Echo added to ledger

5. **See Update** → Echo appears in list
   - Verified echoes have green badge
   - Truth score updates

---

## **🎉 Success Checklist**

- [x] Backend running without errors
- [x] Frontend loads with Echo tab
- [x] Search returns Internet Archive results
- [x] Wallet connects successfully
- [x] Mint button sends transaction
- [x] Echo viewer displays echoes
- [x] Add echo form submits

---

## **🐛 Troubleshooting**

### **Backend Issues**

**Error: "Database connection failed"**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U your_user -d nftsol
```

**Error: "Redis not available"**
- This is OK! Redis is optional. Backend uses in-memory sessions as fallback.

### **Frontend Issues**

**Error: "API request failed"**
```bash
# Verify backend is running
curl http://localhost:3001/healthz

# Check VITE_API_URL in .env
cat .env
```

**Wallet not connecting**
- Install Phantom: https://phantom.app/
- Switch to Devnet in wallet settings
- Airdrop SOL: `solana airdrop 2 YOUR_ADDRESS --url devnet`

### **Anchor Issues**

**Error: "Program not found"**
```bash
# Check deployment
solana program show YOUR_PROGRAM_ID --url devnet

# If not deployed, re-run
anchor deploy --program-name eternal_echoes --provider.cluster devnet
```

**Error: "Compute budget exceeded"**
- This shouldn't happen with our CU limits
- If it does, increase limits in `lib.rs` instructions

---

## **🔧 Development Tools**

### **Useful Commands**

```bash
# Backend
npm run dev          # Start dev server
npm run test         # Run tests
npm run lint         # Check code style

# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run Vitest
npm run cypress:open # E2E tests

# Anchor
anchor build         # Compile program
anchor test          # Run Anchor tests
anchor deploy        # Deploy to cluster
anchor upgrade       # Upgrade deployed program
```

### **Database Management**

```bash
# View echoes table
psql -U your_user -d nftsol
\dt                  # List tables
SELECT * FROM echoes LIMIT 10;

# Reset database (careful!)
DROP TABLE echoes;
npx drizzle-kit push:pg
```

### **Logs & Debugging**

```bash
# Backend logs
tail -f logs/app.log

# Solana program logs
solana logs YOUR_PROGRAM_ID --url devnet

# Frontend console
# Open browser DevTools (F12) → Console tab
```

---

## **🎯 Next Steps**

Once everything works:

1. **Replace Grokipedia Mock**
   - Integrate xAI Grok API
   - Update `apps/backend/src/utils/grokpedia.ts`

2. **Export Anchor IDL**
   ```bash
   anchor build
   cp target/idl/eternal_echoes.json ../../frontend/src/types/
   ```

3. **Complete Anchor Client**
   - Update `EchoMint.tsx` with real program calls
   - Use generated TypeScript types

4. **Add Socket.io Real-time**
   - Initialize WebSocket service
   - Update echo viewer for live updates

5. **Test on Mainnet**
   - Deploy program to mainnet-beta
   - Update all program IDs
   - Test with real SOL

---

## **📚 Resources**

- **Anchor Book**: https://book.anchor-lang.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **Internet Archive API**: https://archive.org/services/docs/api/
- **NFTSol Docs**: See `/docs` folder

---

## **💬 Need Help?**

- Check `/ETERNAL_ECHOES_IMPLEMENTATION.md` for detailed docs
- Review test files in `/tests/eternal-echoes.test.ts`
- Search codebase comments (all files are well-documented)

---

**Happy Remixing! 🎬✨**
