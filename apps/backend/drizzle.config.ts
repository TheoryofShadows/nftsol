import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config. The database connection is read from the environment
 * (DATABASE_URL) — never hardcode credentials in a committed file.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
