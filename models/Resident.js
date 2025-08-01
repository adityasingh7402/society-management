import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  userImage: { type: String },
  additionalNumbers: {
    type: [String],
    validate: {
      validator: function (v) {
        return v.every(num => /^\+91\d{10}$/.test(num));
      },
      message: props => `Invalid phone number(s) in additionalNumbers: ${props.value}`,
    },
  },
  email: { type: String, required: true },
  address: {
    societyName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
  },
  fcmTokens: [String],
  lastTokenUpdate: Date,
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  societyCode: { type: String, required: true },
  societyName: { type: String, required: true },
  residentId: {
    type: String,
    unique: true,
    default: function () {
      const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `R-${timestamp}${randomNum}`;
    },
  },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
  societyVerification: {
    type: String,
    enum: ['Approved', 'Reject', 'Pending'],
    default: 'Pending',
  },
  flatDetails: {
    blockName: { type: String },
    floorIndex: { type: Number },
    flatNumber: { type: String },
    structureType: { type: String }
  },
  notificationPreferences: {
    phone: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  approvedBy: {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
    adminName: { type: String },
    approvedAt: { type: Date }
  },
  
  // Wallet Reference
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  }
});

residentSchema.set('toJSON', { virtuals: false });
residentSchema.set('toObject', { virtuals: false });

const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);

export default Resident;