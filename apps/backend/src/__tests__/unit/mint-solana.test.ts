/**
 * Unit Tests: lib/solana.ts mintNFT()
 *
 * Locks in the behavior of the umi-based mint path (migrated off the
 * deprecated @metaplex-foundation/js): mintNFT must mint a new NFT AND
 * transfer it to the buyer, then return { mintAddress, txSig, success }.
 *
 * The umi / mpl-token-metadata modules are fully mocked so the real
 * (ESM) packages never load under ts-jest, and so we can assert exactly
 * how createNft / transferV1 are invoked.
 */

import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';

const MINT_ADDRESS = 'MintAddr1111111111111111111111111111111111';
const BUYER_ADDRESS = '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad';
const PLATFORM_PK = 'P1atform11111111111111111111111111111111111';
// 64-byte signature → bs58-encoded by the real bs58 in lib/solana.ts
const TX_SIGNATURE = new Uint8Array(64).fill(7);

// --- mock the platform keypair (no env / real key needed) ---
jest.mock('../../lib/platformKeypair', () => ({
  getPlatformKeypair: jest.fn(() => ({
    secretKey: new Uint8Array(64),
    publicKey: { toBase58: () => PLATFORM_PK },
  })),
}));

// --- mock the balance pre-check ---
const mockEnsureBalance = jest.fn<() => Promise<number>>();
jest.mock('../../lib/checkBalance', () => ({
  ensurePlatformBalance: () => mockEnsureBalance(),
}));

// --- mock umi client builder ---
jest.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
  createUmi: jest.fn(() => ({
    use: jest.fn(),
    eddsa: { createKeypairFromSecretKey: jest.fn(() => ({ publicKey: PLATFORM_PK })) },
    identity: { publicKey: PLATFORM_PK },
  })),
}));

// --- mock umi helpers ---
const mockGenerateSigner = jest.fn(() => ({
  publicKey: { toString: () => MINT_ADDRESS },
}));
jest.mock('@metaplex-foundation/umi', () => ({
  createSignerFromKeypair: jest.fn(() => ({ publicKey: PLATFORM_PK })),
  signerIdentity: jest.fn(),
  generateSigner: () => mockGenerateSigner(),
  percentAmount: jest.fn((n: number) => ({ basisPoints: BigInt(Math.round(n * 100)) })),
  publicKey: jest.fn((v: string) => v), // identity → easy to assert against
}));

// --- mock mpl-token-metadata: createNft (mint) + transferV1 (send to buyer) ---
const mockCreateNftSend = jest.fn<() => Promise<unknown>>().mockResolvedValue({});
const mockTransferSend = jest
  .fn<() => Promise<{ signature: Uint8Array }>>()
  .mockResolvedValue({ signature: TX_SIGNATURE });
const mockCreateNft = jest.fn(
  (_umi: unknown, _params: unknown) => ({ sendAndConfirm: () => mockCreateNftSend() })
);
const mockTransferV1 = jest.fn(
  (_umi: unknown, _params: unknown) => ({ sendAndConfirm: () => mockTransferSend() })
);
jest.mock('@metaplex-foundation/mpl-token-metadata', () => ({
  createNft: (_umi: unknown, params: unknown) => mockCreateNft(_umi, params),
  transferV1: (_umi: unknown, params: unknown) => mockTransferV1(_umi, params),
  TokenStandard: { NonFungible: 4 },
}));

// Import after mocks are registered.
import { mintNFT, connection } from '../../lib/solana';

describe('lib/solana mintNFT (umi migration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureBalance.mockResolvedValue(0.05);
    mockCreateNftSend.mockResolvedValue({});
    mockTransferSend.mockResolvedValue({ signature: TX_SIGNATURE });
    // mintNFT validates the RPC connection via getLatestBlockhash
    jest
      .spyOn(connection, 'getLatestBlockhash')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue({ blockhash: 'blockhash', lastValidBlockHeight: 1 } as any);
  });

  it('mints an NFT and transfers it to the buyer', async () => {
    const result = await mintNFT(BUYER_ADDRESS, 'https://example.com/meta.json', 'My NFT');

    // Return shape preserved for all five callers
    expect(result.success).toBe(true);
    expect(result.mintAddress).toBe(MINT_ADDRESS);
    expect(typeof result.txSig).toBe('string');
    expect((result.txSig as string).length).toBeGreaterThan(0);

    // Minted with the expected metadata (NFTSOL symbol, 2.5% royalty)
    expect(mockCreateNft).toHaveBeenCalledTimes(1);
    const createArgs = mockCreateNft.mock.calls[0][1] as Record<string, unknown>;
    expect(createArgs.name).toBe('My NFT');
    expect(createArgs.symbol).toBe('NFTSOL');
    expect(createArgs.uri).toBe('https://example.com/meta.json');

    // THE REGRESSION GUARD: the NFT must be transferred to the buyer,
    // not left in the platform wallet.
    expect(mockTransferV1).toHaveBeenCalledTimes(1);
    const transferArgs = mockTransferV1.mock.calls[0][1] as Record<string, unknown>;
    expect(transferArgs.destinationOwner).toBe(BUYER_ADDRESS);
    expect(transferArgs.tokenStandard).toBe(4); // NonFungible
  });

  it('checks platform balance before minting', async () => {
    await mintNFT(BUYER_ADDRESS, 'https://example.com/meta.json', 'My NFT');
    expect(mockEnsureBalance).toHaveBeenCalledTimes(1);
  });

  it('returns a failure result (does not throw) when minting fails', async () => {
    mockCreateNftSend.mockRejectedValueOnce(new Error('insufficient balance'));

    const result = await mintNFT(BUYER_ADDRESS, 'https://example.com/meta.json', 'My NFT');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // Buyer transfer must NOT happen if the mint failed
    expect(mockTransferV1).not.toHaveBeenCalled();
  });
});
