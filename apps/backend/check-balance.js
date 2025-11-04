const { Connection, PublicKey } = require('@solana/web3.js');

async function checkBalance() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('D5s9G8JBTBDENiozN5ZhgozQoZbb9iuzbtM5yZ6EEVmr');
  
  try {
    const balance = await connection.getBalance(wallet);
    const solBalance = balance / 1_000_000_000;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Platform Wallet Balance:');
    console.log('  Address:', wallet.toBase58());
    console.log('  Balance:', solBalance, 'SOL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (solBalance < 0.1) {
      console.log('\n⚠️  Low balance! You need at least 0.1 SOL to create the tree.');
      console.log('   Fund your wallet at: https://faucet.solana.com/');
    } else {
      console.log('\n✅ Sufficient balance! You can create the tree now.');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();
