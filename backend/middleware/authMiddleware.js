const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../jwtSecret');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Pin the algorithm so a token cannot be re-signed with a different scheme.
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = Number(decoded.user_id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user_id = userId;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token error:', error.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = authenticateUser;
