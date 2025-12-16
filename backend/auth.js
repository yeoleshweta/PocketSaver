// ── backend/auth.js ─────────────────────────────────────────────
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(auth[1], process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};