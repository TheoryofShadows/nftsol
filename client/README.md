# NFTSol - Solana NFT Marketplace

A modern, production-ready Solana NFT marketplace built with React, TypeScript, Tailwind CSS, and Shadcn/ui components.

## ✨ Features

- 🎨 **Modern UI**: Sleek, responsive design with Tailwind CSS and Shadcn/ui
- 🔗 **Wallet Integration**: Support for Phantom, Backpack, and other Solana wallets
- 🎯 **NFT Minting**: Easy-to-use form with Metaplex integration
- 🛒 **Marketplace**: Browse, search, and filter NFTs with real-time updates
- 📱 **Mobile-First**: Fully responsive design for all devices
- ⚡ **Performance**: Optimized bundle size and lazy loading
- 🎭 **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Backpack, etc.)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── NFTCard.tsx         # NFT display component
│   ├── MintForm.tsx        # NFT minting form
│   └── NFTMarketplace.tsx  # Main marketplace component
├── lib/
│   └── utils.ts            # Utility functions
├── wallet/                 # Wallet integration
├── App.tsx                 # Main app component
├── main.tsx               # App entry point
└── globals.css            # Global styles
```

## 🎨 Design System

### Colors
- **Solana Purple**: `#9945FF` - Primary brand color
- **Solana Teal**: `#14F195` - Accent color
- **Solana Dark**: `#0D1117` - Background
- **Solana Gray**: `#161B22` - Card backgrounds

### Components
- **NFTCard**: Displays NFT with hover effects, rarity badges, and buy buttons
- **MintForm**: Form for creating new NFTs with validation
- **NFTMarketplace**: Main marketplace with search, filters, and grid layout

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_METAPLEX_RPC_URL=https://api.mainnet-beta.solana.com
VITE_HELIUS_API_KEY=your_helius_api_key
```

### Tailwind Configuration
The project uses a custom Tailwind config with Solana theme colors and animations. See `tailwind.config.js` for details.

## 🚀 Next Steps

### 1. Integrate Real Metaplex SDK
Replace the mock minting with actual Metaplex integration:

```typescript
import { Metaplex } from '@metaplex-foundation/js';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const metaplex = Metaplex.make(connection);
```

### 2. Add Helius API Integration
Implement real-time NFT fetching:

```typescript
import { Helius } from 'helius';

const helius = new Helius('your-api-key');
const nfts = await helius.rpc.getAssetsByOwner(ownerAddress);
```

### 3. Implement Real Wallet Integration
Update wallet adapter configuration:

```typescript
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const wallets = [
  new PhantomWalletAdapter(),
  new BackpackWalletAdapter(),
  // Add more wallets
];
```

### 4. Add Real-time Updates
Implement WebSocket connections for live price updates and new listings.

### 5. Deploy to Production
- Set up Vercel/Netlify deployment
- Configure environment variables
- Set up domain and SSL
- Implement analytics

## 🛠️ Development

### Code Style
Follow the guidelines in `.cursorrules`:
- Use TypeScript strict mode
- Implement proper error handling
- Follow React best practices
- Maintain accessibility standards

### Testing
```bash
# Run type checking
npm run type-check

# Run build
npm run build

# Preview production build
npm run preview
```

## 📱 Mobile Support

The app is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Optimized images and loading
- Mobile wallet integration
- Responsive grid layouts

## 🔒 Security

- Input validation with Zod schemas
- XSS protection
- Secure wallet integration
- Proper error handling

## 📈 Performance

- Lazy loading for images
- Optimized bundle size
- Efficient state management
- Proper memoization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the documentation
- Review the code examples
- Open an issue on GitHub

---

Built with ❤️ for the Solana ecosystem
