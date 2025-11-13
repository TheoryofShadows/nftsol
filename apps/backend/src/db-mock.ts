// Mock database connection for testing purposes
console.log('🔌 Using mock database connection');

export const pool = {
  query: async (text: string, params?: any[]) => {
    console.log('📝 Mock DB Query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    return { rows: [], rowCount: 0 };
  },
  connect: async () => ({
    release: () => {}
  }),
  on: () => {},
  end: () => Promise.resolve()
};

export default pool;
