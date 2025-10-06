import { Connection, PublicKey } from "@solana/web3.js";

// Solscan API configuration
const SOLSCAN_API_BASE = 'https://api.solscan.io';
const SOLSCAN_API_KEY = import.meta.env.VITE_SOLSCAN_API_KEY || '';

// API endpoints
const ENDPOINTS = {
  account: '/account',
  transaction: '/transaction',
  tokens: '/account/tokens',
  transfers: '/account/transfers',
  nft: '/account/nft',
  token: '/token',
  block: '/block',
  network: '/network'
};

export interface SolscanTransfer {
  signature: string;
  blockTime: number;
  slot: number;
  fee: number;
  status: string;
  lamport: number;
  signer: string[];
  parsedInstruction: any[];
}

export interface SolscanToken {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string;
  decimals: number;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  };
  priceUsdt: number;
  valueUsdt: number;
}

export interface SolscanNFT {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenIcon: string;
  collection: string;
}

export interface SolscanAccountInfo {
  account: string;
  lamports: number;
  ownerProgram: string;
  type: string;
  rentEpoch: number;
  executable: boolean;
}

export interface TransactionDetails {
  signature: string;
  blockTime: number;
  slot: number;
  fee: number;
  status: string;
  lamport: number;
  signer: string[];
  logMessage: string[];
  inputAccount: any[];
  parsedInstruction: any[];
}

class SolscanAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = SOLSCAN_API_KEY;
    this.baseUrl = SOLSCAN_API_BASE;
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.append('apikey', this.apiKey);
    }
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Solscan API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Solscan API request failed:', error);
      throw error;
    }
  }

  /**
   * Get account information and balance
   */
  async getAccountInfo(address: string): Promise<SolscanAccountInfo> {
    return this.makeRequest(ENDPOINTS.account, { address });
  }

  /**
   * Get transaction details by signature
   */
  async getTransactionDetails(signature: string): Promise<TransactionDetails> {
    return this.makeRequest(ENDPOINTS.transaction, { signature });
  }

  /**
   * Get account token holdings
   */
  async getAccountTokens(address: string): Promise<SolscanToken[]> {
    const response = await this.makeRequest(ENDPOINTS.tokens, { address });
    return response.data || [];
  }

  /**
   * Get account transfer history
   */
  async getAccountTransfers(
    address: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<SolscanTransfer[]> {
    const response = await this.makeRequest(ENDPOINTS.transfers, {
      address,
      limit: limit.toString(),
      offset: offset.toString()
    });
    return response.data || [];
  }

  /**
   * Get account NFT holdings
   */
  async getAccountNFTs(address: string): Promise<SolscanNFT[]> {
    const response = await this.makeRequest(ENDPOINTS.nft, { address });
    return response.data || [];
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<any> {
    return this.makeRequest(ENDPOINTS.token, { address: tokenAddress });
  }

  /**
   * Generate Solscan explorer URLs
   */
  generateExplorerUrls(type: 'account' | 'transaction' | 'token', address: string) {
    const baseUrl = 'https://solscan.io';
    switch (type) {
      case 'account':
        return `${baseUrl}/account/${address}`;
      case 'transaction':
        return `${baseUrl}/tx/${address}`;
      case 'token':
        return `${baseUrl}/token/${address}`;
      default:
        return `${baseUrl}`;
    }
  }

  /**
   * Verify transaction success
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const details = await this.getTransactionDetails(signature);
      return details.status === 'Success';
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  /**
   * Get wallet SOL balance from Solscan
   */
  async getWalletBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return accountInfo.lamports / 1000000000; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get wallet balance from Solscan:', error);
      return 0;
    }
  }

  /**
   * Track NFT transactions for a specific mint address
   */
  async trackNFTTransactions(mintAddress: string): Promise<SolscanTransfer[]> {
    try {
      // Get transfers for the mint address
      return await this.getAccountTransfers(mintAddress, 20);
    } catch (error) {
      console.error('Failed to track NFT transactions:', error);
      return [];
    }
  }

  /**
   * Analyze wallet activity
   */
  async analyzeWalletActivity(address: string): Promise<{
    totalTransactions: number;
    recentActivity: SolscanTransfer[];
    tokenHoldings: SolscanToken[];
    nftHoldings: SolscanNFT[];
    solBalance: number;
  }> {
    try {
      const [transfers, tokens, nfts, accountInfo] = await Promise.all([
        this.getAccountTransfers(address, 10),
        this.getAccountTokens(address),
        this.getAccountNFTs(address),
        this.getAccountInfo(address)
      ]);

      return {
        totalTransactions: transfers.length,
        recentActivity: transfers,
        tokenHoldings: tokens,
        nftHoldings: nfts,
        solBalance: accountInfo.lamports / 1000000000
      };
    } catch (error) {
      console.error('Failed to analyze wallet activity:', error);
      return {
        totalTransactions: 0,
        recentActivity: [],
        tokenHoldings: [],
        nftHoldings: [],
        solBalance: 0
      };
    }
  }
}

// Create and export singleton instance
export const solscanAPI = new SolscanAPI();

// Utility functions
export async function getTransactionLink(signature: string): Promise<string> {
  return solscanAPI.generateExplorerUrls('transaction', signature);
}

export async function getAccountLink(address: string): Promise<string> {
  return solscanAPI.generateExplorerUrls('account', address);
}

export async function verifyNFTPurchase(signature: string): Promise<{
  verified: boolean;
  transactionDetails?: TransactionDetails;
  explorerUrl: string;
}> {
  try {
    const verified = await solscanAPI.verifyTransaction(signature);
    const transactionDetails = verified ? await solscanAPI.getTransactionDetails(signature) : undefined;
    const explorerUrl = solscanAPI.generateExplorerUrls('transaction', signature);

    return {
      verified,
      transactionDetails,
      explorerUrl
    };
  } catch (error) {
    console.error('NFT purchase verification failed:', error);
    return {
      verified: false,
      explorerUrl: solscanAPI.generateExplorerUrls('transaction', signature)
    };
  }
}

export async function getEnhancedWalletInfo(address: string): Promise<{
  balance: number;
  recentTransactions: SolscanTransfer[];
  tokens: SolscanToken[];
  nfts: SolscanNFT[];
  explorerUrl: string;
}> {
  try {
    const analysis = await solscanAPI.analyzeWalletActivity(address);
    const explorerUrl = solscanAPI.generateExplorerUrls('account', address);

    return {
      balance: analysis.solBalance,
      recentTransactions: analysis.recentActivity,
      tokens: analysis.tokenHoldings,
      nfts: analysis.nftHoldings,
      explorerUrl
    };
  } catch (error) {
    console.error('Failed to get enhanced wallet info:', error);
    return {
      balance: 0,
      recentTransactions: [],
      tokens: [],
      nfts: [],
      explorerUrl: solscanAPI.generateExplorerUrls('account', address)
    };
  }
}

export default solscanAPI;