// Test setup for CI environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.HELIUS_API_KEY = 'test-key';
process.env.WEBHOOK_SECRET = 'test-secret';
process.env.PINATA_API_KEY = 'test-key';
process.env.PINATA_SECRET_KEY = 'test-secret';
process.env.CLOUT_MINT = '4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf';
process.env.CLOUT_TREASURY = 'J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:5173';