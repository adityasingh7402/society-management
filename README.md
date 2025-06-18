# Society Management System

A comprehensive web application for managing residential societies, built with Next.js and MongoDB.

## 🌟 Features

### 1. User Management
- Resident Management
- Security Staff Management
- Tenant Management
- Role-based Access Control

### 2. Communication
- Real-time Chat System (using Socket.io)
- Help Desk Support
- Announcements
- Notices
- Community Forums

### 3. Financial Management
- Maintenance Bill Generation
- Utility Bill Management
- Payment Tracking
- Penalty Calculation

### 4. Property Management
- Property Listings
- Marketplace for Items
- Interest Management
- Comments and Likes System

### 5. Security Features
- Visitor Management
- Entry/Exit Tracking
- Real-time Notifications
- Image Upload and Verification

### 6. Community Features
- Polls and Surveys
- Community Chat
- Emergency Alerts
- Incident Logs

## 🛠️ Technology Stack

### Frontend
- **Next.js** (v15.1.2) - React framework for production
- **React** (v19.0.0) - UI library
- **TailwindCSS** (v3.4.1) - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Swiper** - Touch slider
- **React Webcam** - Camera integration

### Backend
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Socket.io** - Real-time communication
- **Twilio** - SMS services
- **Firebase** - Cloud services
- **Cloudinary** - Image management
- **JWT** - Authentication

## 📁 Project Structure

```
society-management/
├── components/           # Reusable UI components
│   ├── Chat/            # Chat related components
│   └── Community/       # Community related components
├── lib/                 # Core utilities
│   ├── mongodb.js       # MongoDB configuration
│   └── twilio.js        # Twilio configuration
├── models/              # MongoDB models
├── pages/               # Next.js pages and API routes
│   ├── api/            # Backend API endpoints
│   └── components/     # Page-specific components
├── public/             # Static assets
└── styles/             # Global styles
```

## 🔗 Key File Relationships

1. **Authentication Flow**
   - `pages/login.js` → `api/verify-otp.js` → `api/send-otp.js`
   - Uses JWT and OTP verification

2. **Chat System**
   - `components/Chat/` ↔ `api/chat/` ↔ `models/Message.js`
   - Real-time using Socket.io

3. **Billing System**
   - `api/MaintenanceBill-Api/` ↔ `models/MaintenanceBill.js`
   - `api/UtilityBill-Api/` ↔ `models/UtilityBill.js`

4. **Community Features**
   - `components/Community/` ↔ `api/PollSurvey-Api/` ↔ `models/PollSurvey.js`
   - `api/Announcement-Api/` ↔ `models/Announcement.js`

## 🚀 Getting Started

1. **Prerequisites**
   ```bash
   Node.js >= 20.0.0
   MongoDB
   ```

2. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   CLOUDINARY_URL=your_cloudinary_url
   ```

3. **Installation**
   ```bash
   npm install
   npm run dev
   ```

## 📱 Dashboard Features

The resident dashboard (`pages/Resident-dashboard/components/DashboardDefault.js`) includes:
- Quick stats cards
- Service categories
- Real-time notifications
- Emergency alerts
- Maintenance requests
- Bill payments
- Community updates

## 🔄 API Integration

1. **External Services**
   - Twilio for SMS
   - Cloudinary for images
   - Firebase for notifications

2. **Internal APIs**
   - RESTful endpoints in `pages/api/`
   - WebSocket for real-time features

## 🛡️ Security Considerations

1. **Authentication**
   - JWT-based authentication
   - OTP verification
   - Role-based access control

2. **Data Protection**
   - Encrypted sensitive data
   - Secure file uploads
   - Input validation

## 🎨 UI/UX Features

1. **Modern Design**
   - Responsive layout
   - Animated transitions
   - Interactive components
   - Toast notifications

2. **User Experience**
   - Real-time updates
   - Intuitive navigation
   - Loading states
   - Error handling

## 🔧 Maintenance

Regular tasks to keep in mind:
1. Update dependencies regularly
2. Monitor MongoDB performance
3. Check Socket.io connections
4. Verify Twilio integration
5. Test authentication flow
6. Update security rules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 Notes

- Keep MongoDB indexes optimized
- Monitor real-time connections
- Regular security audits
- Backup database regularly
- Test all features after updates
