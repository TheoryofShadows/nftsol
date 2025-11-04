#!/usr/bin/env node
/**
 * Apply database performance indexes
 * Run with: node apply-indexes.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyIndexes() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set in environment');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Read migration file
    const sqlPath = path.join(__dirname, 'migrations', '005_add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Applying indexes...');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✅ All indexes created successfully!');
    
    // Verify indexes were created
    const result = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('nfts', 'waitlist') 
        AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `);
    
    console.log('\n📊 Created indexes:');
    result.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyIndexes();

