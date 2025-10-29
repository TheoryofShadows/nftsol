const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Discord Bot Configuration
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// NFTSol Configuration
const NFTSOL_CONFIG = {
  apiUrl: 'https://nftsol-dev.onrender.com',
  webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  channelId: process.env.DISCORD_CHANNEL_ID,
  botToken: process.env.DISCORD_BOT_TOKEN,
};

// Bot Ready Event
client.once('ready', () => {
  console.log('🚀 NFTSol Discord Bot is online!');
  console.log(`📊 Monitoring: ${NFTSOL_CONFIG.apiUrl}`);
  client.user.setActivity('NFTSol Marketplace', { type: 'WATCHING' });
});

// Monitor NFT Mints
async function monitorMints() {
  try {
    const response = await axios.get(`${NFTSOL_CONFIG.apiUrl}/api/marketplace/recent`);
    const recentMints = response.data.nfts || [];
    
    for (const nft of recentMints) {
      if (nft.isNew) {
        await postMintEmbed(nft);
      }
    }
  } catch (error) {
    console.error('Error monitoring mints:', error.message);
  }
}

// Post Mint Embed to Discord
async function postMintEmbed(nft) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎨 New NFT Minted!')
      .setDescription(`**${nft.name}** has been minted on NFTSol!`)
      .setColor(0x9945FF) // Solana purple
      .setThumbnail(nft.imageUrl)
      .addFields(
        {
          name: '👤 Creator',
          value: `\`${nft.creator.slice(0, 8)}...${nft.creator.slice(-4)}\``,
          inline: true
        },
        {
          name: '🆔 Mint Address',
          value: `\`${nft.mintAddress.slice(0, 8)}...${nft.mintAddress.slice(-4)}\``,
          inline: true
        },
        {
          name: '⛓️ Transaction',
          value: `[View on Solscan](https://solscan.io/tx/${nft.signature})`,
          inline: true
        },
        {
          name: '📝 Description',
          value: nft.description || 'No description provided',
          inline: false
        }
      )
      .setFooter({
        text: 'NFTSol Marketplace • The fastest NFT platform on Solana',
        iconURL: 'https://nftsol.app/logo.png'
      })
      .setTimestamp();

    const channel = client.channels.cache.get(NFTSOL_CONFIG.channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`✅ Posted mint embed for: ${nft.name}`);
    }
  } catch (error) {
    console.error('Error posting mint embed:', error.message);
  }
}

// Monitor Referral Activity
async function monitorReferrals() {
  try {
    const response = await axios.get(`${NFTSOL_CONFIG.apiUrl}/api/referrals/recent`);
    const recentReferrals = response.data.referrals || [];
    
    for (const referral of recentReferrals) {
      if (referral.isNew) {
        await postReferralEmbed(referral);
      }
    }
  } catch (error) {
    console.error('Error monitoring referrals:', error.message);
  }
}

// Post Referral Embed
async function postReferralEmbed(referral) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎯 New Referral!')
      .setDescription(`Someone just joined through a referral link!`)
      .setColor(0x14F195) // Solana green
      .addFields(
        {
          name: '👤 Referrer',
          value: `\`${referral.referrer.slice(0, 8)}...${referral.referrer.slice(-4)}\``,
          inline: true
        },
        {
          name: '🆕 New User',
          value: `\`${referral.newUser.slice(0, 8)}...${referral.newUser.slice(-4)}\``,
          inline: true
        },
        {
          name: '💰 Commission',
          value: `${referral.commission} SOL`,
          inline: true
        }
      )
      .setFooter({
        text: 'NFTSol Referral System • Earn 5% from every referral',
        iconURL: 'https://nftsol.app/logo.png'
      })
      .setTimestamp();

    const channel = client.channels.cache.get(NFTSOL_CONFIG.channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`✅ Posted referral embed for: ${referral.referrer}`);
    }
  } catch (error) {
    console.error('Error posting referral embed:', error.message);
  }
}

// Monitor Platform Stats
async function postDailyStats() {
  try {
    const response = await axios.get(`${NFTSOL_CONFIG.apiUrl}/api/stats/daily`);
    const stats = response.data;
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Daily NFTSol Stats')
      .setColor(0x00D4FF) // Solana cyan
      .addFields(
        {
          name: '🎨 NFTs Minted Today',
          value: stats.nftsMinted.toString(),
          inline: true
        },
        {
          name: '👥 Active Users',
          value: stats.activeUsers.toString(),
          inline: true
        },
        {
          name: '💰 Revenue (SOL)',
          value: stats.revenue.toFixed(4),
          inline: true
        },
        {
          name: '🎯 Referrals',
          value: stats.referrals.toString(),
          inline: true
        },
        {
          name: '📈 Growth',
          value: `+${stats.growth}%`,
          inline: true
        },
        {
          name: '⚡ Avg Mint Time',
          value: `${stats.avgMintTime}ms`,
          inline: true
        }
      )
      .setFooter({
        text: 'NFTSol Analytics • Updated every 24 hours',
        iconURL: 'https://nftsol.app/logo.png'
      })
      .setTimestamp();

    const channel = client.channels.cache.get(NFTSOL_CONFIG.channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log('✅ Posted daily stats');
    }
  } catch (error) {
    console.error('Error posting daily stats:', error.message);
  }
}

// Handle Messages
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Help command
  if (message.content === '!nftsol help') {
    const embed = new EmbedBuilder()
      .setTitle('🚀 NFTSol Bot Commands')
      .setDescription('Here are the available commands:')
      .setColor(0x9945FF)
      .addFields(
        {
          name: '!nftsol help',
          value: 'Show this help message',
          inline: false
        },
        {
          name: '!nftsol stats',
          value: 'Get current platform statistics',
          inline: false
        },
        {
          name: '!nftsol latest',
          value: 'Show the latest minted NFTs',
          inline: false
        },
        {
          name: '!nftsol referral <code>',
          value: 'Get your referral link and stats',
          inline: false
        }
      )
      .setFooter({
        text: 'NFTSol Marketplace • The fastest NFT platform on Solana',
        iconURL: 'https://nftsol.app/logo.png'
      });

    await message.reply({ embeds: [embed] });
  }

  // Stats command
  if (message.content === '!nftsol stats') {
    try {
      const response = await axios.get(`${NFTSOL_CONFIG.apiUrl}/api/stats`);
      const stats = response.data;
      
      const embed = new EmbedBuilder()
        .setTitle('📊 NFTSol Live Stats')
        .setColor(0x14F195)
        .addFields(
          {
            name: '🎨 Total NFTs',
            value: stats.totalNfts.toString(),
            inline: true
          },
          {
            name: '👥 Total Users',
            value: stats.totalUsers.toString(),
            inline: true
          },
          {
            name: '💰 Total Volume',
            value: `${stats.totalVolume} SOL`,
            inline: true
          }
        )
        .setFooter({
          text: 'Live data from NFTSol API',
          iconURL: 'https://nftsol.app/logo.png'
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Error fetching stats. Please try again later.');
    }
  }
});

// Error Handling
client.on('error', (error) => {
  console.error('Discord bot error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start monitoring
setInterval(monitorMints, 30000); // Check every 30 seconds
setInterval(monitorReferrals, 60000); // Check every minute
setInterval(postDailyStats, 86400000); // Post daily stats

// Login to Discord
client.login(NFTSOL_CONFIG.botToken);

module.exports = client;
