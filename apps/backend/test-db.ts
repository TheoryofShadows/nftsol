import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://nftsol_user:bYjIZyQma4ULjuhx3Uon19EZIeAwr6Vj@dpg-d3t62omuk2gs73a7u0h0-a.ohio-postgres.render.com/nftsol?sslmode=require'
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Database time:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();
