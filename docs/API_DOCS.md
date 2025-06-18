# API Documentation

## Authentication

### Login
```http
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Send OTP
```http
POST /api/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

## Resident APIs

### Register Resident
```http
POST /api/Resident-Api/resident
Content-Type: application/json
Authorization: Bearer {token}

{
  "societyId": "society_id",
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001"
}
```

### Get Resident Details
```http
GET /api/Resident-Api/get-resident/{residentId}
Authorization: Bearer {token}
```

### Update Resident Profile
```http
PUT /api/Resident-Api/update-resident-profile
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "John Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai"
  }
}
```

## Society APIs

### Create Society
```http
POST /api/Society-Api/society
Content-Type: application/json
Authorization: Bearer {token}

{
  "societyName": "Green Valley",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001"
  }
}
```

### Get Society Details
```http
GET /api/Society-Api/get-society-details/{societyId}
Authorization: Bearer {token}
```

## Maintenance APIs

### Create Ticket
```http
POST /api/Maintenance-Api/create-ticket
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Plumbing Issue",
  "description": "Water leakage in bathroom",
  "priority": "High",
  "category": "Plumbing"
}
```

### Get Tickets
```http
GET /api/Maintenance-Api/get-resident-tickets
Authorization: Bearer {token}
```

## Bill APIs

### Generate Bill
```http
POST /api/MaintenanceBill-Api/generateBill
Content-Type: application/json
Authorization: Bearer {token}

{
  "residentId": "resident_id",
  "amount": 1000,
  "dueDate": "2024-04-01",
  "category": "Maintenance"
}
```

### Pay Bill
```http
POST /api/MaintenanceBill-Api/payBill
Content-Type: application/json
Authorization: Bearer {token}

{
  "billId": "bill_id",
  "amount": 1000,
  "paymentMethod": "UPI"
}
```

## Chat APIs

### Send Message
```http
POST /api/Message-Api/sendMessage
Content-Type: application/json
Authorization: Bearer {token}

{
  "recipientId": "recipient_id",
  "content": "Hello!",
  "type": "text"
}
```

### Get Messages
```http
GET /api/Message-Api/getMessages?recipientId={recipientId}
Authorization: Bearer {token}
```

## Notice APIs

### Create Notice
```http
POST /api/Notice-Api/createNotice
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Monthly Meeting",
  "content": "General body meeting on Sunday",
  "priority": "Medium"
}
```

## Poll/Survey APIs

### Create Poll
```http
POST /api/PollSurvey-Api/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "New Garden Proposal",
  "description": "Vote for new garden layout",
  "options": ["Design A", "Design B"],
  "endDate": "2024-04-01"
}
```

## Visitor APIs

### Create Entry
```http
POST /api/VisitorApi/VisitorEntry
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "John Smith",
  "phone": "+919876543210",
  "purpose": "Delivery",
  "flatNumber": "A-101"
}
```

## Error Responses

### Common Error Formats
```json
{
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limits
- Authentication APIs: 5 requests per minute
- Other APIs: 60 requests per minute per token

## WebSocket Events

### Chat Events
```javascript
// Join room
socket.emit('join', { room: 'roomId' });

// Send message
socket.emit('message', {
  room: 'roomId',
  content: 'message',
  type: 'text'
});

// Receive message
socket.on('message', (data) => {
  // Handle incoming message
});
```

### Notification Events
```javascript
// Subscribe to notifications
socket.emit('subscribe', { userId: 'userId' });

// Receive notification
socket.on('notification', (data) => {
  // Handle notification
});
```

## File Upload

### Upload Image
```http
POST /api/upload-images
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- image: (binary)
- type: "profile"|"document"|"maintenance"
```

## Headers

### Required Headers
```http
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

## Environment Variables
Required environment variables for API functionality:
```env
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token
CLOUDINARY_URL=cloudinary://...
``` 