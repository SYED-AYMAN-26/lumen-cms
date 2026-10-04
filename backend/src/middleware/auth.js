import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hasAny } from '../utils/helpers.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    }
    const user = await User.findById(decoded.id).select('+tokenVersion').populate('role');
    if (!user || user.tokenVersion !== decoded.tv) {
      return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'This account is not active.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (hasAny(req.user, perms)) return next();
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  };
}
