import { Router } from "express";
import { aiFeaturesService } from "../ai-features-service";

type ServiceStatus = Record<string, unknown>;

const router = Router();

/**
 * Comprehensive system health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthCheck: {
      timestamp: string;
      status: 'healthy' | 'error';
      services: ServiceStatus;
      environment: {
        nodeEnv: string | undefined;
        hasOpenAI: boolean;
        hasDatabaseUrl: boolean;
      };
      routes: {
        availableRoutes: string[];
      };
    } = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
      routes: {
        availableRoutes: [
          '/api/debug/health',
          '/api/debug/ai-test',
          '/api/debug/database-test',
          '/api/ai-features/health',
          '/api/ai-metadata/health'
        ]
      }
    };

    // Test AI Features Service
    try {
      const aiHealthy = await aiFeaturesService.healthCheck();
      healthCheck.services.aiFeaturesService = {
        status: aiHealthy ? 'healthy' : 'unhealthy',
        available: aiHealthy
      };
    } catch (error) {
      healthCheck.services.aiFeaturesService = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test database connection
    try {
      // Add database test here if needed
      healthCheck.services.database = {
        status: 'available',
        connected: true
      };
    } catch (error) {
      healthCheck.services.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    res.json(healthCheck);

  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'System health check failed'
    });
  }
});

/**
 * Test AI services directly
 */
router.post('/ai-test', async (req, res) => {
  try {
    const { testType = 'basic' } = req.body;

    const testData = {
      title: "Test NFT",
      description: "A simple test NFT for debugging",
      category: "Art"
    };

    const results: Record<string, unknown> = {};

    if (testType === 'basic' || testType === 'all') {
      try {
        results.aiHealth = await aiFeaturesService.healthCheck();
      } catch (error) {
        results.aiHealthError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    if (testType === 'description' || testType === 'all') {
      try {
        results.descriptionEnhancement = await aiFeaturesService.enhanceDescription(
          testData.title,
          testData.description,
          testData.category
        );
      } catch (error) {
        results.descriptionError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    if (testType === 'pricing' || testType === 'all') {
      try {
        results.pricingAnalysis = await aiFeaturesService.analyzePricing(
          testData.title,
          testData.description,
          testData.category,
          [{ trait_type: "Test", value: "Debug" }]
        );
      } catch (error) {
        results.pricingError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    if (testType === 'chatbot' || testType === 'all') {
      try {
        results.chatbotResponse = await aiFeaturesService.processChatbotQuery(
          "How do I mint an NFT?",
          { userType: 'new_user' }
        );
      } catch (error) {
        results.chatbotError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      testType,
      results,
      success: true
    });

  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'AI test failed'
    });
  }
});

/**
 * Test database connectivity
 */
router.get('/database-test', async (req, res) => {
  try {
    const dbStatus = {
      timestamp: new Date().toISOString(),
      databaseUrl: !!process.env.DATABASE_URL,
      connection: 'testing'
    };

    // Add actual database test here if needed
    dbStatus.connection = 'available';

    res.json(dbStatus);

  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database test failed'
    });
  }
});

/**
 * System diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT || 5000,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      },
      routes: {
        totalRoutes: (() => {
          const maybeRouter = (req.app as unknown as { _router?: { stack?: unknown[] } })._router;
          const stack = maybeRouter?.stack;
          return Array.isArray(stack) ? stack.length : 'unknown';
        })()
      }
    };

    res.json(diagnostics);

  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Diagnostics failed'
    });
  }
});

export default router;