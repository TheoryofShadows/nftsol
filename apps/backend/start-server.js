const { spawn } = require('child_process');
const path = require('path');

// Start the server with better error handling
const server = spawn('node', ['-r', 'tsx/register', 'src/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: '*',
    NODE_DEBUG: '*'
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill();
  process.exit(0);
});
