import React, { useState } from 'react';

interface DashboardStatsProps {
  solBalance: number;
  nftCount: number;
  isLoadingBalance: boolean;
}

export default function DashboardStats({
  solBalance,
  nftCount,
  isLoadingBalance,
}: DashboardStatsProps) {
  // Calculate random value once at mount time (accepted pattern for demo data)
  const [randomChange] = useState(() => Math.floor(Math.random() * 3));

  const stats = [
    {
      label: 'SOL Balance',
      value: isLoadingBalance ? '...' : `${solBalance.toFixed(4)} SOL`,
      icon: '💎',
      gradient: 'from-purple-500 to-purple-600',
      change: '+12.5%',
      changePositive: true,
    },
    {
      label: 'NFTs Owned',
      value: nftCount.toString(),
      icon: '🎨',
      gradient: 'from-cyan-500 to-cyan-600',
      change: `+${nftCount > 0 ? randomChange : 0} this month`,
      changePositive: true,
    },
    {
      label: 'Portfolio Value',
      value: '-- SOL',
      icon: '📊',
      gradient: 'from-pink-500 to-pink-600',
      change: 'Calculating...',
      changePositive: null,
    },
    {
      label: 'Total Activity',
      value: '24',
      icon: '⚡',
      gradient: 'from-green-500 to-green-600',
      change: '+8 today',
      changePositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 dashboard-section">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card group cursor-pointer"
          data-animation-delay={Math.round((index * 100) / 50) * 50}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl shadow-lg`}
            >
              {stat.icon}
            </div>
            {stat.changePositive !== null && (
              <div
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.changePositive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {stat.change}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            <div className="text-2xl font-bold gradient-text-primary">{stat.value}</div>
          </div>

          <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 group-hover:scale-x-110 progress-bar`}
              data-width={stat.changePositive !== null ? 75 : 50}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
