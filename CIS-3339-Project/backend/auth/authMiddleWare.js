const jwt = require('jsonwebtoken');
function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Authentication required' });
  try {
    const user = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    if (
      !['viewer', 'editor'].includes(user.role) ||
      !/^[a-f\d]{24}$/i.test(user.orgId || '') ||
      !user.sub
    )
      throw new Error('Invalid claims');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
const requireRole = (role) => (req, res, next) =>
  req.user?.role === role
    ? next()
    : res.status(403).json({ error: 'Editor access required' });
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
