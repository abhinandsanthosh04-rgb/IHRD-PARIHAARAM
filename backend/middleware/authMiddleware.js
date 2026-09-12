const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pariharam-secret');
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const safeUser = { ...user, password: undefined };
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const allowed = roles.map((role) => role.toUpperCase());
  const userRole = req.user.role;

  if (!allowed.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
  }

  next();
};

module.exports = { protect, authorize };
