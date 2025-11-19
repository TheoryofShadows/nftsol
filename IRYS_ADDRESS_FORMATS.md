# 🔄 Irys Address Formats Guide

Irys uses **two different address formats** - understanding both is important for proper setup.

---

## 📋 Two Address Formats

### 1️⃣ **Irys Address** (Base58 Format)
```
2QZrWyPPi4XukwiJQrVmUvuPQ57F
```
- **Format:** Base58 encoding
- **Length:** ~34 characters
- **Type:** Irys native format
- **Use:** When Irys documentation asks for "Irys address"

### 2️⃣ **Execution Address** (Hex/EVM Format)
```
0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32
```
- **Format:** Hexadecimal (0x prefix)
- **Length:** 42 characters (0x + 40 hex digits)
- **Type:** EVM/Ethereum standard format
- **Use:** When Irys documentation asks for "Execution address"

---

## 🔗 They're Connected!

Both addresses come from **the same private key**:

```
Private Key: 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab (Solana format)
    ↓
Irys Address:      2QZrWyPPi4XukwiJQrVmUvuPQ57F
Execution Address: 0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32
```

**Important:** The execution address is just a hex encoding of the Irys address bytes. They're **interchangeable** - both represent the same account!

---

## 🔀 Converting Between Formats

### Method 1: Using Irys Utilities (Recommended)

```typescript
import { irysToExecAddr, execToIrysAddr } from "@irys/js/common/utils";

// Irys → Execution
const execAddr = irysToExecAddr("2QZrWyPPi4XukwiJQrVmUvuPQ57F");
// Result: "0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32"

// Execution → Irys
const irysAddr = execToIrysAddr("0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32");
// Result: "2QZrWyPPi4XukwiJQrVmUvuPQ57F"
```

### Method 2: Using NFTSol Converter

We created a converter utility for you:

```typescript
import { IrysAddressConverter } from '@/services/irys-addresses';

// Convert Irys to Execution
const execAddr = IrysAddressConverter.irysToExecution("2QZrWyPPi4XukwiJQrVmUvuPQ57F");

// Convert Execution to Irys
const irysAddr = IrysAddressConverter.executionToIrys("0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32");

// Auto-detect format and normalize
const both = IrysAddressConverter.normalize("2QZrWyPPi4XukwiJQrVmUvuPQ57F");
console.log(both);
// {
//   irys: "2QZrWyPPi4XukwiJQrVmUvuPQ57F",
//   execution: "0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32",
//   format: "irys"
// }

// Print address info nicely
IrysAddressConverter.printAddressInfo("2QZrWyPPi4XukwiJQrVmUvuPQ57F");
// Output:
// [Irys] Address Information:
//   Input Format: irys
//   Irys Address (base58): 2QZrWyPPi4XukwiJQrVmUvuPQ57F
//   Execution Address (hex): 0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32
```

---

## 🎯 Which Format Should I Use?

### Private Key Setup
You can provide **either format**:

```bash
# Option 1: Solana base58 (RECOMMENDED for NFTSol)
IRYS_WALLET_PRIVATE_KEY=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab

# Option 2: Ethereum hex format (also works)
IRYS_WALLET_PRIVATE_KEY=0x1234567890abcdef...
```

### Getting Your Address
Irys will automatically derive both addresses from your private key:

```typescript
const irysClient = new IrysClient("https://testnet-rpc.irys.xyz/v1");
const addresses = irysClient.account.getAddresses("your_private_key");

console.log(addresses.irys);        // Base58: 2QZrWyPPi4XukwiJQrVmUvuPQ57F
console.log(addresses.execution);   // Hex: 0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32
```

### When You Need Each Format

| Situation | Format | Example |
|-----------|--------|---------|
| Getting balance | Either | `getBalance("2QZrW...")` or `getBalance("0x64f1...")`  |
| Testnet faucet | Execution | `0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32` |
| Arweave links | Neither (use tx ID) | `https://arweave.net/{txId}` |
| Irys docs | Irys | `2QZrWyPPi4XukwiJQrVmUvuPQ57F` |
| EVM tools | Execution | `0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32` |

---

## 💡 Key Points

✅ **One Private Key**
- Single private key generates both addresses
- No need to manage multiple keys
- Same balance across both formats

✅ **Automatic Conversion**
- Irys SDK converts automatically
- Our converter utility handles it
- Use whichever format is convenient

✅ **Cross-Compatible**
- Use Irys address in one command
- Use Execution address in another
- They refer to the same account!

✅ **No Confusion**
- Both formats are valid
- Both access same wallet
- No difference in functionality

---

## 🔍 Quick Reference

```
Your Private Key (Solana): 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
          ↓
Creates TWO addresses (same account):
  • Irys Address:      2QZrWyPPi4XukwiJQrVmUvuPQ57F
  • Execution Address: 0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32

Both formats:
  ✅ Access same wallet
  ✅ Have same balance
  ✅ Can be used interchangeably
  ✅ Are derived from same key
```

---

## 🧪 Test Conversion

### Using Node REPL

```bash
cd apps/backend
node
```

```javascript
// Import utilities
const { irysToExecAddr, execToIrysAddr } = require("@irys/js/common/utils");

// Test conversion
const irysAddr = "2QZrWyPPi4XukwiJQrVmUvuPQ57F";
const execAddr = irysToExecAddr(irysAddr);

console.log("Irys:", irysAddr);
console.log("Exec:", execAddr);
```

### Using Our Converter

```typescript
import { IrysAddressConverter } from './src/services/irys-addresses';

IrysAddressConverter.printAddressInfo("2QZrWyPPi4XukwiJQrVmUvuPQ57F");
```

---

## ❓ FAQ

### Q: Which format should I use in my .env?
**A:** Either works! We recommend Solana base58 format since you're using a Solana key.

### Q: Can I use both addresses interchangeably?
**A:** Yes! They access the same account. Use whichever is convenient.

### Q: Will my balance be different in each format?
**A:** No! The balance is the same - you're just viewing the same account in different encodings.

### Q: What if I only have one format?
**A:** Use our converter to get the other: `IrysAddressConverter.normalize(address)`

### Q: Is the hex format the same as Ethereum?
**A:** Yes! It's EVM-compatible. You can use it with any Ethereum tool.

---

## 🔐 Security

⚠️ **Never share either address format with:**
- Private key
- Seed phrase
- Wallet backup

✅ **Safe to share:**
- Irys address (public)
- Execution address (public)
- Transaction IDs

---

## 📚 Resources

- [Irys Docs - Addresses](https://docs.irys.xyz/)
- [Irys GitHub - @irys/js](https://github.com/irys-xyz/irys-js)
- [Conversion Utils](https://github.com/irys-xyz/irys-js/blob/main/src/common/utils.ts)

---

**You now understand both Irys address formats!** 🎓

Next: Add your private key to `.env` and restart the backend!
