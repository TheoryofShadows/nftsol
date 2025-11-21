/**
 * Tax Export Service
 * Export NFT transaction history in formats compatible with tax software
 *
 * Supported formats: CSV, Koinly, CoinTracker, TokenTax, TurboTax
 */

import logger from '../utils/logger';
import { heliusService } from './helius';

export interface TaxTransaction {
  date: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'mint' | 'transfer_in' | 'transfer_out' | 'airdrop';
  asset: string;
  assetName?: string;
  collection?: string;
  amount: number;
  costBasis: number;
  proceeds: number;
  fee: number;
  feeCurrency: string;
  currency: string;
  txHash: string;
  exchange: string;
  notes?: string;
}

export interface TaxSummary {
  wallet: string;
  year: number;
  totalBuys: number;
  totalSells: number;
  totalMints: number;
  totalCostBasis: number;
  totalProceeds: number;
  realizedGain: number;
  realizedLoss: number;
  netGainLoss: number;
  transactionCount: number;
  exportedAt: number;
}

export type ExportFormat = 'csv' | 'koinly' | 'cointracker' | 'tokentax' | 'turbotax';

class TaxExportService {
  /**
   * Get all NFT transactions for a wallet
   */
  async getTransactions(
    wallet: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<TaxTransaction[]> {
    try {
      const txLimit = options.limit || 1000;

      // Fetch transaction history from Helius
      const result = await heliusService.getTransactionsForAddress(wallet, {
        limit: txLimit,
        type: 'nft',
        beforeTime: options.endDate ? Math.floor(options.endDate.getTime() / 1000) : undefined,
        afterTime: options.startDate ? Math.floor(options.startDate.getTime() / 1000) : undefined,
      });

      const history = result.transactions;
      const transactions: TaxTransaction[] = [];

      for (const tx of history) {
        // Determine NFT data from events or token transfers
        const nftEvent = tx.events?.find(e => e.type === 'NFT_SALE' || e.type === 'NFT_TRANSFER');
        const nftMint = tx.tokenTransfers?.[0]?.mint || nftEvent?.data?.mint || 'Unknown';

        // Determine if user is seller or buyer based on native transfer direction
        const nativeTransfer = tx.nativeTransfers?.[0];
        const isSeller = nativeTransfer ? nativeTransfer.to === wallet : tx.feePayer !== wallet;
        const solAmount = (nativeTransfer?.amount || 0) / 1e9;

        // Parse NFT sale/purchase transactions
        if (tx.type === 'NFT_SALE' || tx.type === 'NFT_BID' || tx.type === 'NFT_LISTING') {
          const taxTx: TaxTransaction = {
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            timestamp: tx.timestamp * 1000,
            type: isSeller ? 'sell' : 'buy',
            asset: nftMint,
            assetName: nftEvent?.data?.name || 'NFT',
            collection: nftEvent?.data?.collection,
            amount: 1, // NFTs are typically 1
            costBasis: isSeller ? 0 : solAmount,
            proceeds: isSeller ? solAmount : 0,
            fee: (tx.fee || 0) / 1e9,
            feeCurrency: 'SOL',
            currency: 'SOL',
            txHash: tx.signature,
            exchange: 'Solana NFT Marketplace',
          };

          transactions.push(taxTx);
        } else if (tx.type === 'NFT_MINT' || tx.type === 'COMPRESSED_NFT_MINT') {
          const taxTx: TaxTransaction = {
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            timestamp: tx.timestamp * 1000,
            type: 'mint',
            asset: nftMint,
            assetName: nftEvent?.data?.name || 'Minted NFT',
            collection: nftEvent?.data?.collection,
            amount: 1,
            costBasis: solAmount,
            proceeds: 0,
            fee: (tx.fee || 0) / 1e9,
            feeCurrency: 'SOL',
            currency: 'SOL',
            txHash: tx.signature,
            exchange: 'NFT Mint',
            notes: 'NFT Minting cost',
          };

          transactions.push(taxTx);
        }
      }

      // Sort by date
      transactions.sort((a, b) => a.timestamp - b.timestamp);

      return transactions;
    } catch (error) {
      logger.error(`Error fetching tax transactions for ${wallet}:`, error);
      return [];
    }
  }

  /**
   * Calculate tax summary
   */
  calculateSummary(transactions: TaxTransaction[], wallet: string, year: number): TaxSummary {
    const yearTxs = transactions.filter((tx) => {
      const txYear = new Date(tx.timestamp).getFullYear();
      return txYear === year;
    });

    let totalCostBasis = 0;
    let totalProceeds = 0;
    let totalBuys = 0;
    let totalSells = 0;
    let totalMints = 0;

    for (const tx of yearTxs) {
      if (tx.type === 'buy') {
        totalBuys++;
        totalCostBasis += tx.costBasis;
      } else if (tx.type === 'sell') {
        totalSells++;
        totalProceeds += tx.proceeds;
      } else if (tx.type === 'mint') {
        totalMints++;
        totalCostBasis += tx.costBasis;
      }
    }

    const netGainLoss = totalProceeds - totalCostBasis;

    return {
      wallet,
      year,
      totalBuys,
      totalSells,
      totalMints,
      totalCostBasis,
      totalProceeds,
      realizedGain: netGainLoss > 0 ? netGainLoss : 0,
      realizedLoss: netGainLoss < 0 ? Math.abs(netGainLoss) : 0,
      netGainLoss,
      transactionCount: yearTxs.length,
      exportedAt: Date.now(),
    };
  }

  /**
   * Export to CSV format
   */
  exportToCSV(transactions: TaxTransaction[]): string {
    const headers = [
      'Date',
      'Type',
      'Asset',
      'Asset Name',
      'Collection',
      'Amount',
      'Cost Basis (SOL)',
      'Proceeds (SOL)',
      'Fee (SOL)',
      'Transaction Hash',
      'Exchange',
      'Notes',
    ];

    const rows = transactions.map((tx) => [
      tx.date,
      tx.type.toUpperCase(),
      tx.asset,
      tx.assetName || '',
      tx.collection || '',
      tx.amount.toString(),
      tx.costBasis.toFixed(6),
      tx.proceeds.toFixed(6),
      tx.fee.toFixed(6),
      tx.txHash,
      tx.exchange,
      tx.notes || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    return csv;
  }

  /**
   * Export to Koinly format
   */
  exportToKoinly(transactions: TaxTransaction[]): string {
    const headers = [
      'Date',
      'Sent Amount',
      'Sent Currency',
      'Received Amount',
      'Received Currency',
      'Fee Amount',
      'Fee Currency',
      'Net Worth Amount',
      'Net Worth Currency',
      'Label',
      'Description',
      'TxHash',
    ];

    const rows = transactions.map((tx) => {
      let sentAmount = '';
      let sentCurrency = '';
      let receivedAmount = '';
      let receivedCurrency = '';
      let label = '';

      if (tx.type === 'buy' || tx.type === 'mint') {
        sentAmount = tx.costBasis.toFixed(6);
        sentCurrency = 'SOL';
        receivedAmount = tx.amount.toString();
        receivedCurrency = tx.asset.slice(0, 10); // Koinly uses short names
        label = tx.type === 'mint' ? 'cost' : '';
      } else if (tx.type === 'sell') {
        sentAmount = tx.amount.toString();
        sentCurrency = tx.asset.slice(0, 10);
        receivedAmount = tx.proceeds.toFixed(6);
        receivedCurrency = 'SOL';
      }

      return [
        new Date(tx.timestamp).toISOString(),
        sentAmount,
        sentCurrency,
        receivedAmount,
        receivedCurrency,
        tx.fee.toFixed(6),
        'SOL',
        '', // Net Worth Amount
        '', // Net Worth Currency
        label,
        tx.assetName || tx.collection || '',
        tx.txHash,
      ];
    });

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Export to CoinTracker format
   */
  exportToCoinTracker(transactions: TaxTransaction[]): string {
    const headers = [
      'Date',
      'Received Quantity',
      'Received Currency',
      'Sent Quantity',
      'Sent Currency',
      'Fee Amount',
      'Fee Currency',
      'Tag',
    ];

    const rows = transactions.map((tx) => {
      let receivedQty = '';
      let receivedCurrency = '';
      let sentQty = '';
      let sentCurrency = '';
      let tag = '';

      if (tx.type === 'buy') {
        receivedQty = tx.amount.toString();
        receivedCurrency = 'NFT';
        sentQty = tx.costBasis.toFixed(6);
        sentCurrency = 'SOL';
      } else if (tx.type === 'sell') {
        receivedQty = tx.proceeds.toFixed(6);
        receivedCurrency = 'SOL';
        sentQty = tx.amount.toString();
        sentCurrency = 'NFT';
      } else if (tx.type === 'mint') {
        receivedQty = tx.amount.toString();
        receivedCurrency = 'NFT';
        sentQty = tx.costBasis.toFixed(6);
        sentCurrency = 'SOL';
        tag = 'mint';
      }

      return [
        new Date(tx.timestamp).toLocaleString('en-US'),
        receivedQty,
        receivedCurrency,
        sentQty,
        sentCurrency,
        tx.fee.toFixed(6),
        'SOL',
        tag,
      ];
    });

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Export to TokenTax format
   */
  exportToTokenTax(transactions: TaxTransaction[]): string {
    const headers = [
      'Type',
      'BuyAmount',
      'BuyCurrency',
      'SellAmount',
      'SellCurrency',
      'FeeAmount',
      'FeeCurrency',
      'Exchange',
      'Group',
      'Comment',
      'Date',
    ];

    const rows = transactions.map((tx) => {
      let type = 'Trade';
      let buyAmount = '';
      let buyCurrency = '';
      let sellAmount = '';
      let sellCurrency = '';

      if (tx.type === 'buy') {
        buyAmount = tx.amount.toString();
        buyCurrency = 'NFT';
        sellAmount = tx.costBasis.toFixed(6);
        sellCurrency = 'SOL';
      } else if (tx.type === 'sell') {
        buyAmount = tx.proceeds.toFixed(6);
        buyCurrency = 'SOL';
        sellAmount = tx.amount.toString();
        sellCurrency = 'NFT';
      } else if (tx.type === 'mint') {
        type = 'Spend';
        sellAmount = tx.costBasis.toFixed(6);
        sellCurrency = 'SOL';
        buyAmount = tx.amount.toString();
        buyCurrency = 'NFT';
      }

      return [
        type,
        buyAmount,
        buyCurrency,
        sellAmount,
        sellCurrency,
        tx.fee.toFixed(6),
        'SOL',
        tx.exchange,
        'NFT',
        tx.assetName || '',
        new Date(tx.timestamp).toLocaleString('en-US'),
      ];
    });

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Export to TurboTax format (Form 8949 style)
   */
  exportToTurboTax(transactions: TaxTransaction[]): string {
    // TurboTax expects Form 8949 format for capital gains
    const headers = [
      'Description of Property',
      'Date Acquired',
      'Date Sold',
      'Proceeds',
      'Cost Basis',
      'Adjustment Code',
      'Adjustment Amount',
      'Gain or Loss',
    ];

    // Only include sell transactions for capital gains
    const sellTxs = transactions.filter((tx) => tx.type === 'sell');

    const rows = sellTxs.map((tx) => {
      const gainLoss = tx.proceeds - tx.costBasis;

      return [
        `NFT: ${tx.assetName || tx.asset.slice(0, 20)}`,
        'Various', // Date acquired - would need to track buy dates
        tx.date,
        tx.proceeds.toFixed(2),
        tx.costBasis.toFixed(2),
        '', // Adjustment code
        '', // Adjustment amount
        gainLoss.toFixed(2),
      ];
    });

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Export transactions to specified format
   */
  export(transactions: TaxTransaction[], format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return this.exportToCSV(transactions);
      case 'koinly':
        return this.exportToKoinly(transactions);
      case 'cointracker':
        return this.exportToCoinTracker(transactions);
      case 'tokentax':
        return this.exportToTokenTax(transactions);
      case 'turbotax':
        return this.exportToTurboTax(transactions);
      default:
        return this.exportToCSV(transactions);
    }
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): Array<{ id: ExportFormat; name: string; description: string }> {
    return [
      { id: 'csv', name: 'CSV', description: 'Generic CSV format for any spreadsheet' },
      { id: 'koinly', name: 'Koinly', description: 'Compatible with Koinly tax software' },
      { id: 'cointracker', name: 'CoinTracker', description: 'Compatible with CoinTracker' },
      { id: 'tokentax', name: 'TokenTax', description: 'Compatible with TokenTax' },
      { id: 'turbotax', name: 'TurboTax', description: 'Form 8949 format for TurboTax' },
    ];
  }
}

// Singleton instance
let taxExportService: TaxExportService;

export function getTaxExportService(): TaxExportService {
  if (!taxExportService) {
    taxExportService = new TaxExportService();
  }
  return taxExportService;
}

export { TaxExportService };
export default getTaxExportService;
