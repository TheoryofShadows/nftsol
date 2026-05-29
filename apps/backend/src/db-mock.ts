import logger from './utils/logger';
// Mock database connection for testing purposes
logger.info('🔌 Using mock database connection');

export const pool = {
  query: async (text: string, _params?: any[]) => {
    logger.info('📝 Mock DB Query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    return { rows: [], rowCount: 0 };
  },
  connect: async () => ({
    release: () => {}
  }),
  on: () => {},
  end: () => Promise.resolve()
};

export default pool;
