const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const client = jwksClient({
  jwksUri: 'https://ep-empty-shadow-ab4zlr84.neonauth.eu-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json'
});

function getKey(header, callback) {
  if (header.alg === 'HS256') {
    // Custom legacy token
    return callback(null, process.env.JWT_SECRET);
  }
  
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err, null);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, getKey, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Ensure id mapping (Neon Auth uses 'sub', custom token uses 'id')
    const userId = decoded.id || decoded.sub;
    req.user = decoded; // Initialize req.user so we can set properties on it
    
    // Ensure we have the latest data from DB (including role, plan, subscription_status)
    try {
      const userResult = await db.query('SELECT role, plan, subscription_status FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        req.user.role = userResult.rows[0].role;
        req.user.plan = userResult.rows[0].plan;
        req.user.subscription_status = userResult.rows[0].subscription_status;
      } else {
        // Auto-create user for Google Login (Neon Auth) if not in DB
        if (decoded.email) {
          const name = decoded.user_metadata?.full_name || decoded.user_metadata?.name || decoded.email.split('@')[0];
          const newRole = decoded.email === 'handersonchemane@gmail.com' ? 'admin' : 'user';
          // DEFAULT plan to free and status to inactive
          await db.query(
            'INSERT INTO users (id, name, email, role, plan, subscription_status) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, name, decoded.email, newRole, 'free', 'inactive']
          );
          req.user.role = newRole;
          req.user.plan = 'free';
          req.user.subscription_status = 'inactive';
        }
      }
    } catch (dbErr) {
      console.error('Auth middleware DB error:', dbErr);
    }
    
    next();
  });
};
