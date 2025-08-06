import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-16 bg-gradient-card border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-orbitron font-bold mb-4">Stay in the Loop</h2>
        <p className="text-gray-400 text-lg mb-8">
          Get notified about new collections, drops, and exclusive events
        </p>

        {isSubscribed ? (
          <div className="text-solana-green text-lg font-semibold">
            Thank you for subscribing! 🎉
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-solana-purple transition-colors duration-300"
            />
            <button
              type="submit"
              className="bg-gradient-solana hover:opacity-80 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="text-sm text-gray-400 mt-4">Join 15,000+ creators and collectors</p>
      </div>
    </section>
  );
}
