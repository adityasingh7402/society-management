import jwt from 'jsonwebtoken';

export const verifyToken = (token) => {
  if (!token) {
    console.error('No token provided');
    return null;
  }

  // Debug token type and format
  console.log(`Token type: ${typeof token}, length: ${token.length}`);
  console.log(`Token preview: ${token.substring(0, 10)}...`);

  // Handle Bearer token format
  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
    console.log('Removed Bearer prefix from token');
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment');
    return null;
  }

  // Debug JWT secret (first few chars)
  console.log(`JWT_SECRET exists, length: ${process.env.JWT_SECRET.length}`);
  console.log(`JWT_SECRET preview: ${process.env.JWT_SECRET.substring(0, 3)}...`);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Validate that decoded token has a userId
    if (!decoded || !decoded.id) {
      console.error('Invalid token format: missing user id');
      return null;
    }
    
    console.log(`Token verified successfully for user: ${decoded.id}`);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired:', error.expiredAt);
    } else if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error:', error.message);
    } else {
      console.error('Token verification failed:', error);
    }
    return null;
  }
};