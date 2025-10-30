import 'dotenv/config';
import { server } from './app-production';
import { db } from './db';

const PORT = process.env.PORT || 3001;

async function start() {
  // Connect to database (Drizzle)
  try {
    // Test connection
    await db.execute('SELECT 1');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Backend listening on ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Solana: ${process.env.CLUSTER}`);
  });
}

start().catch(console.error);
