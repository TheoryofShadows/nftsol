#!/usr/bin/env node
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  try {
    jwt = require(require('path').resolve(__dirname, '..', 'apps', 'backend', 'node_modules', 'jsonwebtoken'));
  } catch (e2) {
    console.error('jsonwebtoken module not found. Run npm install in apps/backend.');
    process.exit(1);
  }
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET env var is required');
  process.exit(1);
}

const role = process.argv[2] || 'user';
let payload;
if (role === 'admin') {
  payload = { id: 'admin-1', username: 'admin', isAdmin: true };
} else {
  payload = { id: 'user-123', username: 'testuser', isAdmin: false };
}

const token = jwt.sign(payload, secret, { expiresIn: '30m' });
console.log(token);
