import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  console.log('Authorization header received:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'No Authorization header found',
      received_headers: Object.keys(req.headers)
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authorization header must start with "Bearer "',
      received: authHeader
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token missing after Bearer',
      authorization_header: authHeader
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      decoded: decoded,
      token_length: token.length,
      expires_at: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Token verification failed',
      details: error.message,
      token_present: !!token,
      token_length: token ? token.length : 0,
      jwt_secret_present: !!process.env.JWT_SECRET
    });
  }
}
