/**
 * Utility to debug the authentication token
 */

export const debugToken = () => {
  try {
    const token = localStorage.getItem('Resident');
    
    if (!token) {
      console.error('No token found in localStorage');
      return { valid: false, error: 'No token found' };
    }
    
    console.log('Token found in localStorage');
    
    // Check if it has Bearer prefix
    const hasBearer = token.startsWith('Bearer ');
    console.log('Has Bearer prefix:', hasBearer);
    
    // Get token without Bearer prefix
    const cleanToken = hasBearer ? token.slice(7).trim() : token;
    
    // Check if token is in valid JWT format (xxxxx.yyyyy.zzzzz)
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
    const isValidFormat = jwtRegex.test(cleanToken);
    console.log('Valid JWT format:', isValidFormat);
    
    // Decode token payload (without verification)
    try {
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        console.error('Token does not have 3 parts');
        return { valid: false, error: 'Invalid token structure' };
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      
      return { 
        valid: true, 
        userId: payload.userId,
        exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiration',
        cleanToken,
        hasBearer
      };
    } catch (e) {
      console.error('Error decoding token:', e);
      return { valid: false, error: 'Failed to decode token' };
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return { valid: false, error: error.message };
  }
}; 