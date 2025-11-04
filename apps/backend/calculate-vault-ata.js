const { PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');

async function calculateATA() {
  const mintAddress = '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab';
  const ownerAddress = '3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o';
  
  const mint = new PublicKey(mintAddress);
  const owner = new PublicKey(ownerAddress);
  
  // Calculate ATA (deterministic - same result every time)
  const ata = await getAssociatedTokenAddress(mint, owner);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Rewards Vault ATA Address:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(ata.toBase58());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nThis is the actual address that will be used');
  console.log('when sending CLOUT rewards. It will be created');
  console.log('automatically on the first reward transfer.');
  console.log('\nYou can verify this address on Solana Explorer:');
  console.log('https://explorer.solana.com/address/' + ata.toBase58() + '?cluster=devnet');
}

calculateATA().catch(console.error);
