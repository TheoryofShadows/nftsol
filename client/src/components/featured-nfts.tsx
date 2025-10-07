import { useState } from "react";
import { useLocation } from "wouter";

export default function FeaturedNFTs() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Art", "Gaming", "Music", "Photography"];

  const nfts = [
    {
      id: 1,
      name: "Mad Lads #1847",
      creator: "Backpack Team",
      image: "https://nftstorage.link/ipfs/QmYxJSYQnqKHhGgSMVLKE8oMaZXr9GgvjHJCiVacvCLm4H",
      currentBid: "32.5 SOL"
    },
    {
      id: 2,
      name: "Solana Monkey #4721",
      creator: "SolanaMonkey",
      image: "https://arweave.net/FXWat3Qv1LjgbjcabQoXAqnb5n8pCLFc3y87BHNwTNEb",
      currentBid: "59.0 SOL"
    },
    {
      id: 3,
      name: "Claynosaurz #1256",
      creator: "Claynosaurz Studio",
      image: "https://metadata.claynosaurz.com/1256.png",
      currentBid: "2.85 SOL"
    },
    {
      id: 4,
      name: "Froganas #3421",
      creator: "Tee",
      image: "https://arweave.net/B-RGgm_l-B2GmtGvmXhQXNy0QLaVoUKuPLyb7o5WqYU",
      currentBid: "1.75 SOL"
    }
  ];

  return (
    <section className="modern-section py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-orbitron font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            Featured NFTs
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Discover exceptional digital art from top creators on the Solana blockchain
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="modern-card p-1 inline-flex">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  activeFilter === filter
                    ? "modern-btn"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="modern-grid">
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className="modern-card overflow-hidden group cursor-pointer"
              onClick={() => setLocation('/marketplace')}
            >
              <img
                src={`https://via.placeholder.com/400x300/14f195/000000?text=${encodeURIComponent(nft.name)}`}
                alt={nft.name}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/400x300/14f195/000000?text=${encodeURIComponent(nft.name)}`;
                }}
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{nft.name}</h3>
                <p className="text-gray-400 text-sm mb-3">by {nft.creator}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">Current Bid</div>
                    <div className="text-lg font-semibold text-solana-green">
                      {nft.currentBid}
                    </div>
                  </div>
                  <button 
                    className="bg-gradient-solana hover:opacity-80 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/marketplace');
                    }}
                  >
                    Place Bid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="border border-white/20 hover:bg-white/5 px-8 py-3 rounded-lg font-semibold transition-all duration-300">
            Load More NFTs
          </button>
        </div>
      </div>
    </section>
  );
}
