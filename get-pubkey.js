const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');

const secretKeyBase58 = '44YHwC9nX9Mv2fque7fZdpinbtR3pGqX6xKsj4Tzpp5jx34C3PuCVriPZrbutpocC1wwZFJn53hrDwPuXpc5KWqc';

// Decode the base58 secret key to bytes
const secretKey = bs58.decode(secretKeyBase58);

// Create keypair from secret key
const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Get the public key
console.log('Public Key (Base58):', keypair.publicKey.toBase58());
