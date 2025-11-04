const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds instead of 2
  ssl: {
    rejectUnauthorized: false // Accept Render's SSL certificate
  }
});

console.log('Testing database connection...');
console.log('Timeout: 10 seconds');

pool.query('SELECT NOW() as time, version() as version')
  .then((result) => {
    console.log('✅ Database connection successful!');
    console.log('Time:', result.rows[0].time);
    console.log('PostgreSQL Version:', result.rows[0].version.substring(0, 60) + '...');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    if (err.code === 'ETIMEDOUT') {
      console.error('   Connection timed out - check network/firewall');
    } else if (err.code === 'ENOTFOUND') {
      console.error('   Host not found - check hostname');
    } else if (err.message.includes('password')) {
      console.error('   Authentication failed - check credentials');
    }
    process.exit(1);
  });
