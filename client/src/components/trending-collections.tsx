export default function TrendingCollections() {
  const collections = [
    {
      id: 1,
      name: "Mad Lads",
      description: "xNFTs with embedded code giving ownership rights to executable NFTs",
      image: "https://nftstorage.link/ipfs/QmYxJSYQnqKHhGgSMVLKE8oMaZXr9GgvjHJCiVacvCLm4H",
      floorPrice: "32.5 SOL",
      volume24h: "4.2K SOL",
      change: "+12.3%"
    },
    {
      id: 2,
      name: "DeGods",
      description: "God-like NFTs with DeadGods visual upgrades and DeDAO governance",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23dc2626'/%3E%3Ctext x='200' y='120' font-family='Arial, sans-serif' font-size='24' font-weight='bold' text-anchor='middle' fill='white'%3EDeGods%3C/text%3E%3Ctext x='200' y='150' font-family='Arial, sans-serif' font-size='16' text-anchor='middle' fill='%23fecaca'%3E45.2 SOL Floor%3C/text%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='14' text-anchor='middle' fill='%23fed7d7'%3EDe Labs%3C/text%3E%3C/svg%3E",
      floorPrice: "45.2 SOL",
      volume24h: "8.7K SOL",
      change: "+8.9%"
    },
    {
      id: 3,
      name: "Lil Chiller",
      description: "Limited edition digital assets from the viral 3,333 collection",
      image: "https://arweave.net/SdJ-VWKfKkXnrpF3QYJfNEHY8kMy_FoQz8pGb2Qz0Q4",
      floorPrice: "0.89 SOL",
      volume24h: "2.1M SOL",
      change: "+1,000%"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-transparent to-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-orbitron font-bold">Trending Collections</h2>
          <button className="text-solana-green hover:text-solana-purple transition-colors duration-300">
            View All <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-card-bg backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-solana-purple/50 transition-all duration-300 group cursor-pointer"
              onClick={() => window.location.href = '/marketplace'}
            >
              <div className="relative">
                <img
                  src={`https://via.placeholder.com/400x300/9333ea/ffffff?text=${encodeURIComponent(collection.name)}`}
                  alt={collection.name}
                  className="w-full h-48 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/400x300/9333ea/ffffff?text=${encodeURIComponent(collection.name)}`;
                  }}
                />
                <div className="absolute top-4 left-4 bg-solana-green text-black px-3 py-1 rounded-full text-sm font-semibold">
                  {collection.change}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
              <p className="text-gray-400 mb-4">{collection.description}</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">Floor Price</div>
                  <div className="text-lg font-semibold text-solana-purple">
                    {collection.floorPrice}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Volume (24h)</div>
                  <div className="text-lg font-semibold">{collection.volume24h}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}