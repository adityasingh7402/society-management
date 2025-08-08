# Society API Authentication Guide and Examples

## Token Authentication

All Society APIs now require proper JWT token authentication. The token must be sent in the `Authorization` header as a Bearer token.

### Token Validation Implementation

Each API now includes:
```js
// Verify token and authorization
const token = req.headers.authorization?.split(' ')[1];
if (!token) {
    await logFailure('ACTION_TYPE', req, 'Unauthorized: Token missing');
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
}

let decoded;
try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
    await logFailure('ACTION_TYPE', req, 'Unauthorized: Invalid token');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
}
```

## How to Send Tokens

### Method 1: Using curl
```bash
curl -X PUT "http://localhost:3000/api/Society-Api/update-security-profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "securityId": "SEC123",
    "guardName": "John Doe",
    "guardPhone": "9876543210"
  }'
```

### Method 2: Using JavaScript Fetch API
```javascript
const response = await fetch('/api/Society-Api/update-society-profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    societyId: 'SOC123',
    societyName: 'Green Valley Apartments',
    managerName: 'Jane Smith',
    managerPhone: '9876543210'
  })
});
```

### Method 3: Using Axios
```javascript
const response = await axios.put('/api/Society-Api/update-security-verify', 
  {}, // Empty body for query-based endpoint
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    params: {
      securityId: 'SEC123',
      status: 'Approved'
    }
  }
);
```

### Method 4: Using Postman
1. Set the request method (GET, POST, PUT, etc.)
2. Enter the API URL
3. Go to the "Authorization" tab
4. Select "Bearer Token" from the dropdown
5. Paste your JWT token in the Token field
6. Add your request body/query parameters as needed

## Updated APIs with Token Authentication

### 1. Update Security Profile
- **Endpoint**: `PUT /api/Society-Api/update-security-profile`
- **Auth**: Bearer token required
- **Logging**: CUD operations only

### 2. Update Society Profile
- **Endpoint**: `PUT /api/Society-Api/update-society-profile`
- **Auth**: Bearer token required
- **Logging**: CUD operations only

### 3. Update Security Verification Status
- **Endpoint**: `PUT /api/Society-Api/update-security-verify`
- **Auth**: Bearer token required
- **Logging**: CUD operations only

### 4. Helpdesk Messages
- **Endpoints**: 
  - `GET /api/Society-Api/helpdesk-messages` (No logging - GET operation)
  - `POST /api/Society-Api/helpdesk-messages` (With logging - CREATE operation)
  - `PATCH /api/Society-Api/helpdesk-messages` (With logging - UPDATE operation)
- **Auth**: Bearer token required via middleware
- **Special**: Uses society-specific token validation

## Token Structure

Your JWT token should contain relevant user information:
```json
{
  "userId": "user123",
  "phone": "+919876543210", 
  "role": "admin",
  "societyId": "SOC123", // For society-specific APIs
  "exp": 1735689600
}
```

## Error Responses

### Missing Token
```json
{
  "error": "Unauthorized: Token missing"
}
```

### Invalid Token
```json
{
  "error": "Unauthorized: Invalid token"
}
```

### Expired Token
```json
{
  "error": "Unauthorized: Invalid token"
}
```

## Activity Logging

All CUD (Create, Update, Delete) operations are logged with:
- Success logs: Include operation details, user info, and affected resources
- Failure logs: Include error details, validation failures, and context
- GET operations: No activity logging (as requested)

## Testing Your Token

To test if your token is valid, you can make a simple API call:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X GET "http://localhost:3000/api/Society-Api/get-society-details?societyId=SOC123"
```

If you receive a 401 error, your token is invalid or expired.
If you receive data or a 200 status, your token is working correctly.

## Getting a Valid Token

To get a valid JWT token, you need to:
1. Use your login API endpoint
2. Provide valid credentials
3. Extract the token from the response
4. Use this token in subsequent API calls

Example login flow:
```javascript
// 1. Login to get token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    password: 'yourpassword'
  })
});

const { token } = await loginResponse.json();

// 2. Use token for Society API calls
const societyResponse = await fetch('/api/Society-Api/update-society-profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    societyId: 'SOC123',
    societyName: 'Updated Name'
  })
});
```
