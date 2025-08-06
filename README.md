# NFTSol - Solana NFT Marketplace

A modern NFT marketplace built for the Solana blockchain, featuring fast transactions, low fees, and a sleek cyberpunk-inspired design.

## Features

- 🚀 **Lightning Fast**: Built on Solana for ultra-fast transactions
- 💎 **Modern Design**: Cyberpunk-inspired UI with Solana brand colors
- 🔗 **Wallet Integration**: Connect with popular Solana wallets
- 📱 **Responsive**: Works perfectly on all devices
- 🎨 **Creator Tools**: Easy NFT creation and management
- 📊 **Analytics**: Track trends and market data

## Tech Stack

- **Frontend**: React 18 + TypeScript with Vite
- **Styling**: Tailwind CSS + Shadcn/UI components  
- **Backend**: Node.js + Express with advanced services
- **Database**: PostgreSQL with Drizzle ORM
- **Admin**: Dedicated admin dashboard
- **Blockchain**: Solana integration with wallet connectivity
- **Deployment**: Multi-platform (Vercel, Railway, Netlify)

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nftsol.git
cd nftsol
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
nftsol/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
├── server/                # Primary Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database interface
├── backend-advanced/      # Extended backend services
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── routes/           # API route definitions
│   ├── utils/            # Helper utilities
│   └── webhooks/         # Blockchain event handlers
├── admin-dashboard/       # Admin management interface
├── contracts/            # Solana smart contracts
├── scripts/              # Automation and utility scripts
│   ├── generateCSVReport.js
│   ├── simulateResale.js
│   └── runDevSimulations.js
├── shared/               # Shared schemas and types
└── .github/              # CI/CD workflows
```

## Deployment

### Quick GitHub Setup

1. **Create GitHub Repository**
   - Go to [github.com/new](https://github.com/new)
   - Name: `nftsol`
   - Don't initialize with README

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: NFTSol marketplace with advanced backend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nftsol.git
   git push -u origin main
   ```

3. **Deploy to Production**
   - **Vercel**: Connect GitHub repo for frontend + serverless API
   - **Railway**: Full-stack with database support
   - **Netlify**: Static site with serverless functions

### Domain Configuration (NFTSol.app)

Add CNAME records to your domain:
```
www.nftsol.app → your-deployment.vercel.app
nftsol.app → your-deployment.vercel.app
```

## Advanced Features

### Admin Dashboard
Access the admin interface at `/admin` for:
- Platform management
- User administration  
- NFT moderation
- Analytics dashboard

### Automation Scripts
```bash
# Generate marketplace reports
node scripts/generateCSVReport.js

# Simulate NFT resales
node scripts/simulateResale.js

# Run development simulations
node scripts/runDevSimulations.js
```

### API Endpoints
- `/api/nfts` - NFT marketplace operations
- `/api/users` - User management
- `/api/admin` - Administrative functions
- `/api/webhooks` - Blockchain events

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Visit the documentation
- Contact the development team

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@nftsol.app or join our Discord community.

---

Built with ❤️ for the Solana ecosystem