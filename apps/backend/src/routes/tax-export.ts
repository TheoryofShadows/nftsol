/**
 * Tax Export Routes
 * Export NFT transaction history for tax software
 */

import { Router } from 'express';
import { getTaxExportService, ExportFormat } from '../services/tax-export.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/tax/formats
 * Get supported export formats
 */
router.get('/formats', (req, res) => {
  try {
    const taxService = getTaxExportService();
    const formats = taxService.getSupportedFormats();

    res.json({ success: true, data: formats });
  } catch (error) {
    logger.error('Error fetching formats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch formats' });
  }
});

/**
 * GET /api/tax/transactions/:wallet
 * Get all NFT transactions for a wallet
 */
router.get('/transactions/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 1000;

    if (!wallet || wallet.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const taxService = getTaxExportService();
    const transactions = await taxService.getTransactions(wallet, {
      startDate,
      endDate,
      limit,
    });

    res.json({
      success: true,
      data: transactions,
      total: transactions.length,
      wallet,
    });
  } catch (error) {
    logger.error('Error fetching tax transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/tax/summary/:wallet/:year
 * Get tax summary for a specific year
 */
router.get('/summary/:wallet/:year', async (req, res) => {
  try {
    const { wallet, year } = req.params;
    const yearNum = parseInt(year);

    if (!wallet || wallet.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year',
      });
    }

    const taxService = getTaxExportService();
    const transactions = await taxService.getTransactions(wallet, {
      startDate: new Date(`${yearNum}-01-01`),
      endDate: new Date(`${yearNum}-12-31`),
    });

    const summary = taxService.calculateSummary(transactions, wallet, yearNum);

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error calculating tax summary:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate summary' });
  }
});

/**
 * GET /api/tax/export/:wallet
 * Export transactions in specified format
 */
router.get('/export/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const format = (req.query.format as ExportFormat) || 'csv';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    if (!wallet || wallet.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const validFormats = ['csv', 'koinly', 'cointracker', 'tokentax', 'turbotax'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported: ${validFormats.join(', ')}`,
      });
    }

    // If year is provided, use it for date range
    let start = startDate;
    let end = endDate;
    if (year) {
      start = new Date(`${year}-01-01`);
      end = new Date(`${year}-12-31`);
    }

    const taxService = getTaxExportService();
    const transactions = await taxService.getTransactions(wallet, {
      startDate: start,
      endDate: end,
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No transactions found for the specified period',
      });
    }

    const csvContent = taxService.export(transactions, format);

    // Set appropriate headers for file download
    const filename = `nft-tax-export-${wallet.slice(0, 8)}-${format}-${year || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting tax data:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

/**
 * POST /api/tax/export
 * Export transactions with custom options (JSON response)
 */
router.post('/export', async (req, res) => {
  try {
    const { wallet, format, startDate, endDate, year } = req.body;

    if (!wallet || wallet.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const validFormats = ['csv', 'koinly', 'cointracker', 'tokentax', 'turbotax'];
    const exportFormat = validFormats.includes(format) ? format : 'csv';

    let start = startDate ? new Date(startDate) : undefined;
    let end = endDate ? new Date(endDate) : undefined;

    if (year) {
      start = new Date(`${year}-01-01`);
      end = new Date(`${year}-12-31`);
    }

    const taxService = getTaxExportService();
    const transactions = await taxService.getTransactions(wallet, {
      startDate: start,
      endDate: end,
    });

    const csvContent = taxService.export(transactions, exportFormat);
    const summary = taxService.calculateSummary(
      transactions,
      wallet,
      year || new Date().getFullYear()
    );

    res.json({
      success: true,
      data: {
        content: csvContent,
        format: exportFormat,
        transactionCount: transactions.length,
        summary,
      },
    });
  } catch (error) {
    logger.error('Error exporting tax data:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;
