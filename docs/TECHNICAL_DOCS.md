# Technical Documentation

## Database Configuration

### MongoDB Connection (`lib/mongodb.js`)
```javascript
import mongoose from 'mongoose';

const connectToDatabase = async () => {
  if (mongoose.connections[0].readyState) {
    return; // Reuse existing connection
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000
  });
};
```

Key features:
- Connection pooling
- Timeout configuration
- Error handling
- Connection reuse

## Model Structure

### Base Model Pattern
All models follow this structure:
```javascript
import mongoose from 'mongoose';

const schemaName = new mongoose.Schema({
  // Schema definition
});

// Add any middleware
schemaName.pre('save', function(next) {});

// Add any methods
schemaName.methods.customMethod = function() {};

// Add any statics
schemaName.statics.customStatic = function() {};

// Create model
const ModelName = mongoose.models.ModelName || mongoose.model('ModelName', schemaName);

export default ModelName;
```

### Key Models

1. **Resident Model** (`models/Resident.js`)
   ```javascript
   {
     name: String,
     phone: String (unique),
     email: String,
     societyId: ObjectId,
     residentId: String (auto-generated),
     societyVerification: Enum['Approved', 'Reject', 'Pending'],
     flatDetails: {
       blockName: String,
       floorIndex: Number,
       flatNumber: String,
       structureType: String
     }
   }
   ```

2. **Society Model** (`models/Society.js`)
   - Manages society information
   - Contains resident references
   - Handles verification status

3. **Message Model** (`models/Message.js`)
   - Real-time chat functionality
   - Socket.io integration
   - Message history

4. **MaintenanceBill Model** (`models/MaintenanceBill.js`)
   - Bill generation
   - Payment tracking
   - Penalty calculation

## API Structure

### API Route Pattern
```javascript
import connectToDatabase from "../../../lib/mongodb";
import RequiredModel from "../../../models/RequiredModel";

export default async function handler(req, res) {
  // 1. Method check
  if (req.method !== 'EXPECTED_METHOD') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Input validation
  const { required_fields } = req.body;
  if (!required_fields) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    // 3. Database connection
    await connectToDatabase();

    // 4. Business logic
    const result = await RequiredModel.operation();

    // 5. Response
    res.status(200).json(result);
  } catch (error) {
    // 6. Error handling
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### API Categories

1. **Resident APIs**
   - `/api/Resident-Api/resident.js`: Registration
   - `/api/Resident-Api/[residentId]/[action].js`: Dynamic actions
   - `/api/Resident-Api/get-resident.js`: Fetch details

2. **Society APIs**
   - Society management
   - Apartment structure
   - Security management

3. **Maintenance APIs**
   - Ticket creation
   - Status updates
   - Resolution tracking

4. **Bill APIs**
   - Bill generation
   - Payment processing
   - Penalty calculation

## Authentication & Security

### JWT Implementation
```javascript
import jwt from 'jsonwebtoken';

// Token generation
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Token verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### OTP System
- SMS-based verification using Twilio
- Time-based expiration
- Rate limiting

## Real-time Features

### Socket.io Implementation
```javascript
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('message', async (data) => {
    // Handle message
    io.to(data.room).emit('message', data);
  });
});
```

### Real-time Events
1. Chat messages
2. Notifications
3. Status updates
4. Emergency alerts

## External Service Integration

### 1. Twilio
```javascript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: message,
  to: phoneNumber,
  from: process.env.TWILIO_PHONE_NUMBER
});
```

### 2. Cloudinary
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### 3. Firebase
```javascript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

## Error Handling

### Global Error Pattern
```javascript
try {
  // Operation
} catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate Entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }
  
  console.error('Error:', error);
  return res.status(500).json({
    message: 'Internal Server Error'
  });
}
```

## Data Validation

### Mongoose Validation
```javascript
{
  field: {
    type: String,
    required: [true, 'Field is required'],
    validate: {
      validator: function(v) {
        return /pattern/.test(v);
      },
      message: props => `${props.value} is invalid!`
    }
  }
}
```

### API Input Validation
```javascript
function validateInput(data) {
  const { required_field } = data;
  
  if (!required_field) {
    throw new Error('Required field missing');
  }
  
  if (!/pattern/.test(required_field)) {
    throw new Error('Invalid format');
  }
}
```

## Performance Optimization

### Database Indexes
```javascript
schemaName.index({ field: 1 });
schemaName.index({ field1: 1, field2: -1 });
```

### Query Optimization
```javascript
// Use lean for read-only operations
const data = await Model.find().lean();

// Select specific fields
const data = await Model.find().select('field1 field2');

// Populate with specific fields
const data = await Model.findById(id).populate('ref', 'field1 field2');
```

## Testing Guidelines

1. **Unit Tests**
   ```javascript
   describe('Model', () => {
     it('should validate required fields', () => {
       // Test
     });
   });
   ```

2. **API Tests**
   ```javascript
   describe('API', () => {
     it('should handle valid requests', async () => {
       // Test
     });
   });
   ```

## Deployment Considerations

1. **Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=your-token
   CLOUDINARY_URL=cloudinary://...
   ```

2. **Security Headers**
   ```javascript
   // Add in next.config.js
   {
     headers: [
       {
         source: '/:path*',
         headers: [
           {
             key: 'X-Frame-Options',
             value: 'DENY'
           },
           // Other security headers
         ]
       }
     ]
   }
   ```

## Maintenance Tasks

1. **Database Maintenance**
   - Index optimization
   - Regular backups
   - Performance monitoring

2. **API Monitoring**
   - Response times
   - Error rates
   - Usage patterns

3. **Security Updates**
   - Dependencies
   - Security patches
   - Access controls

4. **Performance Optimization**
   - Caching strategies
   - Query optimization
   - Resource utilization 