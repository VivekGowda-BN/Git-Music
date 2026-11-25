const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret) < 32) {
  throw new Error('Set JWT_SECRET to at least 32 bytes before starting the backend.');
}
module.exports = secret;
