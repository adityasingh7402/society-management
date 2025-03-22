import mongoose from 'mongoose';

const SecuritySchema = new mongoose.Schema(
  {
    securityId: {
      type: String,
      unique: true,
      required: true,
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    guardName: {
      type: String,
      required: true,
    },
    guardPhone: {
      type: String,
      required: true,
      unique: true,
    },
    guardImage: {
      type: String,
      default: 'Pending',
      required: false,
    },
    shiftTimings: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    societyVerification: {
      type: String,
      enum: ['Approved', 'Reject', 'Pending'],
      default: 'Pending',
    },
    address: {
      societyName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
    },
    visitorLogs: [
      {
        visitorName: { type: String, required: true },
        visitorPhone: { type: String, required: true },
        personId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'personModel' },
        personModel: { type: String, required: true, enum: ['Resident', 'Tenant'] },
        purpose: { type: String, required: true },
        entryTime: { type: Date, default: Date.now },
        exitTime: { type: Date },
        status: { type: String, enum: ['Approved', 'Rejected', 'Pending'], required: true },
      },
    ],
    deliveryLogs: [
      {
        deliveryPersonName: { type: String, required: true },
        deliveryCompany: { type: String },
        personId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'personModel' },
        personModel: { type: String, required: true, enum: ['Resident', 'Tenant'] },
        packageDetails: { type: String },
        receivedTime: { type: Date, default: Date.now },
        status: { type: String, enum: ['Notified', 'Picked Up'], required: true },
      },
    ],
    incidentReports: [
      {
        incidentType: { type: String, required: true },
        description: { type: String, required: true },
        reportedBy: { type: String, required: true },
        reportedTime: { type: Date, default: Date.now },
        attachments: [String],
        resolutionStatus: { type: String, enum: ['Resolved', 'Pending'], default: 'Pending' },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Security || mongoose.model('Security', SecuritySchema);
