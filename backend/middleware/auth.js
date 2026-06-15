// ============================================
// JWT Authentication Middleware
// ============================================
// Verifies the JWT token from the Authorization header.
// Attaches the decoded user payload to req.user.
// Protected routes use this middleware to ensure
// only authenticated users can access them.
// ============================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // 2. Expect format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token format invalid.'
      });
    }

    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user data to the request object
    // decoded contains: { id, name, email, iat, exp }
    req.user = decoded;

    // 5. Proceed to the next middleware / route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = verifyToken;
