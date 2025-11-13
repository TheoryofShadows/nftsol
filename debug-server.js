const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'debug-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/'
  }
}));

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('Cookies:', req.cookies);
  
  // Set a test session variable
  req.session.testValue = 'test_' + Date.now();
  
  // Set a test cookie
  res.cookie('test_cookie', 'test_value_' + Date.now(), {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'lax'
  });
  
  res.json({
    success: true,
    sessionId: req.sessionID,
    session: req.session,
    cookies: req.cookies
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
  console.log('Test endpoint: GET /api/test');
});
