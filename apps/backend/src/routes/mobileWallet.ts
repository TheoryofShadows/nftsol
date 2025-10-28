import { Router } from 'express';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getMobileWalletService, getPushNotificationService, getDeepLinkService } from '../services/mobileWalletService';
import { getSolanaConnection } from '../config/solana';

const router = Router();

/**
 * Connect to mobile wallet
 */
router.post('/connect', async (req, res) => {
  try {
    console.log('📱 Connecting to mobile wallet...');

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    const result = await mobileWalletService.connectMobileWallet();

    res.json({
      success: true,
      data: {
        publicKey: result.publicKey.toString(),
        signature: result.signature,
        connected: true
      },
      message: 'Successfully connected to mobile wallet'
    });

  } catch (error) {
    console.error('❌ Failed to connect mobile wallet:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect mobile wallet'
    });
  }
});

/**
 * Disconnect from mobile wallet
 */
router.post('/disconnect', async (req, res) => {
  try {
    console.log('📱 Disconnecting from mobile wallet...');

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    await mobileWalletService.disconnectMobileWallet();

    res.json({
      success: true,
      data: {
        connected: false
      },
      message: 'Successfully disconnected from mobile wallet'
    });

  } catch (error) {
    console.error('❌ Failed to disconnect mobile wallet:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect mobile wallet'
    });
  }
});

/**
 * Sign transaction on mobile
 */
router.post('/sign-transaction', async (req, res) => {
  try {
    const { transactionData }: { transactionData: string } = req.body;

    if (!transactionData) {
      return res.status(400).json({
        success: false,
        error: 'Missing transaction data'
      });
    }

    console.log('📱 Signing transaction on mobile...');

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    // Deserialize transaction
    const transaction = Transaction.from(Buffer.from(transactionData, 'base64'));
    
    const signedTransaction = await mobileWalletService.signTransactionMobile(transaction);

    res.json({
      success: true,
      data: {
        signedTransaction: Buffer.from(signedTransaction.serialize()).toString('base64'),
        signature: signedTransaction.signature?.toString()
      },
      message: 'Transaction signed successfully on mobile'
    });

  } catch (error) {
    console.error('❌ Failed to sign transaction on mobile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign transaction on mobile'
    });
  }
});

/**
 * Sign multiple transactions on mobile
 */
router.post('/sign-transactions', async (req, res) => {
  try {
    const { transactionsData }: { transactionsData: string[] } = req.body;

    if (!transactionsData || !Array.isArray(transactionsData)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid transactions data'
      });
    }

    console.log(`📱 Signing ${transactionsData.length} transactions on mobile...`);

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    // Deserialize transactions
    const transactions = transactionsData.map(data => 
      Transaction.from(Buffer.from(data, 'base64'))
    );
    
    const signedTransactions = await mobileWalletService.signAllTransactionsMobile(transactions);

    res.json({
      success: true,
      data: {
        signedTransactions: signedTransactions.map(tx => 
          Buffer.from(tx.serialize()).toString('base64')
        ),
        signatures: signedTransactions.map(tx => tx.signature?.toString())
      },
      message: `Successfully signed ${transactionsData.length} transactions on mobile`
    });

  } catch (error) {
    console.error('❌ Failed to sign transactions on mobile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign transactions on mobile'
    });
  }
});

/**
 * Sign message on mobile
 */
router.post('/sign-message', async (req, res) => {
  try {
    const { message }: { message: string } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing message'
      });
    }

    console.log('📱 Signing message on mobile...');

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    const messageBytes = new TextEncoder().encode(message);
    const signedMessage = await mobileWalletService.signMessageMobile(messageBytes);

    res.json({
      success: true,
      data: {
        signedMessage: Buffer.from(signedMessage).toString('base64'),
        message: message
      },
      message: 'Message signed successfully on mobile'
    });

  } catch (error) {
    console.error('❌ Failed to sign message on mobile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign message on mobile'
    });
  }
});

/**
 * Request airdrop on mobile
 */
router.post('/airdrop', async (req, res) => {
  try {
    const { publicKey, amount }: { publicKey: string; amount: number } = req.body;

    if (!publicKey || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing publicKey or amount'
      });
    }

    console.log(`📱 Requesting ${amount} SOL airdrop on mobile...`);

    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    const signature = await mobileWalletService.requestAirdropMobile(
      new PublicKey(publicKey),
      amount
    );

    res.json({
      success: true,
      data: {
        signature: signature,
        amount: amount,
        publicKey: publicKey
      },
      message: `Successfully requested ${amount} SOL airdrop`
    });

  } catch (error) {
    console.error('❌ Failed to request airdrop on mobile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request airdrop on mobile'
    });
  }
});

/**
 * Get mobile wallet status
 */
router.get('/status', async (req, res) => {
  try {
    const connection = getSolanaConnection();
    const mobileWalletService = getMobileWalletService(connection);

    const isConnected = mobileWalletService.isMobileWalletConnected();
    const publicKey = mobileWalletService.getMobileWalletPublicKey();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        publicKey: publicKey?.toString() || null,
        walletType: 'mobile'
      },
      message: 'Mobile wallet status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get mobile wallet status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mobile wallet status'
    });
  }
});

/**
 * Send push notification
 */
router.post('/notifications/send', async (req, res) => {
  try {
    const { title, body, data }: { title: string; body: string; data?: any } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing title or body'
      });
    }

    console.log('📱 Sending push notification...');

    const pushNotificationService = getPushNotificationService();
    await pushNotificationService.sendNotification({ title, body, data });

    res.json({
      success: true,
      data: {
        title,
        body,
        data
      },
      message: 'Push notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send push notification'
    });
  }
});

/**
 * Request notification permission
 */
router.post('/notifications/permission', async (req, res) => {
  try {
    console.log('📱 Requesting notification permission...');

    const pushNotificationService = getPushNotificationService();
    const permission = await pushNotificationService.requestPermission();

    res.json({
      success: true,
      data: {
        permission: permission,
        supported: true
      },
      message: permission ? 'Notification permission granted' : 'Notification permission denied'
    });

  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request notification permission'
    });
  }
});

/**
 * Generate deep link for wallet connection
 */
router.post('/deep-link/wallet-connect', async (req, res) => {
  try {
    const { walletType, returnUrl }: { walletType: string; returnUrl: string } = req.body;

    if (!walletType || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing walletType or returnUrl'
      });
    }

    const deepLinkService = getDeepLinkService();
    const deepLink = deepLinkService.generateWalletConnectionLink(walletType, returnUrl);

    res.json({
      success: true,
      data: {
        deepLink: deepLink,
        walletType: walletType,
        returnUrl: returnUrl
      },
      message: 'Deep link generated successfully'
    });

  } catch (error) {
    console.error('❌ Failed to generate deep link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate deep link'
    });
  }
});

/**
 * Generate deep link for transaction signing
 */
router.post('/deep-link/transaction', async (req, res) => {
  try {
    const { transactionData, returnUrl }: { transactionData: string; returnUrl: string } = req.body;

    if (!transactionData || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing transactionData or returnUrl'
      });
    }

    const deepLinkService = getDeepLinkService();
    const deepLink = deepLinkService.generateTransactionLink(transactionData, returnUrl);

    res.json({
      success: true,
      data: {
        deepLink: deepLink,
        transactionData: transactionData,
        returnUrl: returnUrl
      },
      message: 'Transaction deep link generated successfully'
    });

  } catch (error) {
    console.error('❌ Failed to generate transaction deep link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate transaction deep link'
    });
  }
});

/**
 * Generate deep link for fair launch participation
 */
router.post('/deep-link/fair-launch', async (req, res) => {
  try {
    const { fairLaunch, returnUrl }: { fairLaunch: string; returnUrl: string } = req.body;

    if (!fairLaunch || !returnUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing fairLaunch or returnUrl'
      });
    }

    const deepLinkService = getDeepLinkService();
    const deepLink = deepLinkService.generateFairLaunchLink(fairLaunch, returnUrl);

    res.json({
      success: true,
      data: {
        deepLink: deepLink,
        fairLaunch: fairLaunch,
        returnUrl: returnUrl
      },
      message: 'Fair launch deep link generated successfully'
    });

  } catch (error) {
    console.error('❌ Failed to generate fair launch deep link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate fair launch deep link'
    });
  }
});

/**
 * Handle deep link callback
 */
router.post('/deep-link/callback', async (req, res) => {
  try {
    const { url }: { url: string } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing URL'
      });
    }

    const deepLinkService = getDeepLinkService();
    const result = deepLinkService.handleDeepLinkCallback(url);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deep link URL'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Deep link callback handled successfully'
    });

  } catch (error) {
    console.error('❌ Failed to handle deep link callback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle deep link callback'
    });
  }
});

export default router;
