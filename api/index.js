const app = require('../backend/server.js');

// Health check specifically for Vercel deployment verification
app.get('/api/vercel-health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running as a Vercel Function!',
    timestamp: new Date().toISOString(),
    env: {
      db_configured: !!(process.env.DATABASE_URL || process.env.URL_BANCO_DE_DADOS),
      jwt_configured: !!process.env.JWT_SECRET
    }
  });
});

module.exports = app;
