// Small in-memory limiter for the credential endpoints. A single-process
// deployment is enough for this API; use a shared store if it is ever scaled
// horizontally.
const buckets = new Map();

function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many attempts. Try again later.' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}|${req.path}`;
    const entry = buckets.get(key);
    if (!entry || entry.reset <= now) {
      buckets.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.reset <= now) buckets.delete(key);
  }
}, 60 * 1000);
if (typeof sweeper.unref === 'function') sweeper.unref();

module.exports = { rateLimit };
