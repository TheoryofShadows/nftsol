export default function CreatorSpotlight() {
  const creators = [
    {
      id: 1,
      name: "Tee",
      bio: "Digital Artist & Creator of Froganas",
      avatar: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/tee_avatar.png",
      totalSales: "179K SOL",
      totalNFTs: "5,555"
    },
    {
      id: 2,
      name: "De Labs",
      bio: "Creators of DeGods & y00ts",
      avatar: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://metadata.degods.com/delabs-logo.png",
      totalSales: "452K SOL",
      totalNFTs: "25,000"
    },
    {
      id: 3,
      name: "Backpack Team",
      bio: "xNFT Innovators & Mad Lads Creators",
      avatar: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://madlist-assets.s3.us-west-2.amazonaws.com/backpack-logo.png",
      totalSales: "325K SOL",
      totalNFTs: "10,000"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-black/20 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-orbitron font-bold mb-4">Creator Spotlight</h2>
          <p className="text-gray-400 text-lg">
            Meet the artists shaping the future of digital art
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="bg-card-bg backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-solana-purple/50 transition-all duration-300"
            >
              <img
                src={creator.avatar}
                alt={creator.name}
                className={`w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 ${
                  creator.id === 2 ? "border-solana-green" : "border-solana-purple"
                }`}
              />
              <h3 className="text-xl font-semibold mb-2">{creator.name}</h3>
              <p className="text-gray-400 mb-4">{creator.bio}</p>
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <div className="text-solana-green font-semibold">
                    {creator.totalSales}
                  </div>
                  <div className="text-gray-400">Total Sales</div>
                </div>
                <div>
                  <div className="text-solana-purple font-semibold">
                    {creator.totalNFTs}
                  </div>
                  <div className="text-gray-400">NFTs Created</div>
                </div>
              </div>
              <button className="w-full bg-gradient-solana hover:opacity-80 py-2 rounded-lg font-semibold transition-all duration-300">
                Follow Artist
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
