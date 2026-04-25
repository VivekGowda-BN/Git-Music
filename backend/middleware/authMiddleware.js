const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secret123';

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
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user_id = decoded.user_id;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token error:', error.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = authenticateUser;
