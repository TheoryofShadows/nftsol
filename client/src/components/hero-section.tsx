import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="pt-16 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark opacity-90"></div>
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-solana-purple rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-solana-green rounded-full opacity-80 animate-ping"></div>
        <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-solana-purple rounded-full opacity-40 animate-bounce"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-4">
            <span className="text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-green-400 bg-clip-text">
              DISCOVER
            </span>
            <br />
            <span className="text-white">Rare NFTs</span>
          </h1>
          <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
            The premier marketplace for Solana NFTs. Discover, collect, and trade
            unique digital assets with lightning-fast transactions and minimal
            fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/marketplace">
              <button className="modern-btn text-lg px-8 py-4">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>Explore Marketplace
              </button>
            </Link>
            <Link href="/create">
              <button className="modern-card border border-white/30 hover:border-white/50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/10">
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>Create NFT
              </button>
            </Link>
          </div>
        </div>

        {/* Stats - Real NFTSol Platform Data - Moved to prevent mobile overlap */}
        <div className="mt-16 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="text-center modern-card p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-solana-green">33M+</div>
            <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2">Solana NFTs<br className="sm:hidden" /> Minted</div>
          </div>
          <div className="text-center modern-card p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-solana-purple">3B+<br className="sm:hidden" /><span className="text-base sm:text-3xl"> SOL</span></div>
            <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2">Total NFT<br className="sm:hidden" /> Volume</div>
          </div>
          <div className="text-center modern-card p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-solana-green">178K</div>
            <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2">Monthly<br className="sm:hidden" /> Active Users</div>
          </div>
          <div className="text-center modern-card p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-solana-purple">95.5%</div>
            <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2">Seller<br className="sm:hidden" /> Retention</div>
          </div>
        </div>
      </div>
    </section>
  );
}