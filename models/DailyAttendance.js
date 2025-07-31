import mongoose from 'mongoose';

const DailyAttendanceSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    visitors: [
      {
        visitorName: { type: String, required: true },
        visitorPhone: { type: String, required: true },
        visitorImage: { type: String },
        visitorType: { 
          type: String, 
          enum: ['GateVisitor', 'VehicleTag', 'AnimalTag', 'GatePass', 'ServicePersonnel'], 
          required: true 
        },
        tagId: { 
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'visitors.tagModel',
          required: false
        },
        tagModel: {
          type: String,
          enum: ['VehicleTag', 'AnimalTag', 'GatePass', 'ServicePass'],
          required: false
        },
        purpose: { type: String, required: true },
        entryTime: { type: Date, required: true },
        expectedExitTime: { type: Date, required: true },
        actualExitTime: { type: Date },
        status: { 
          type: String, 
          enum: ['Inside', 'Left', 'Overstayed'], 
          default: 'Inside',
          required: true 
        },
        approvedBy: {
          securityId: { type: String, required: true },
          guardName: { type: String, required: true },
          guardPhone: { type: String, required: true }
        },
        exitMarkedBy: {
          personId: { type: String },
          personType: { 
            type: String, 
            enum: ['Security', 'Society', 'Admin', 'manager', 'security_admin'],
            default: null
          },
          personName: { type: String },
          personPhone: { type: String },
          exitTime: { type: Date }
        },
        residentDetails: {
          personId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            refPath: 'visitors.residentDetails.personModel' 
          },
          personModel: { 
            type: String, 
            required: true, 
            enum: ['Resident', 'Tenant'] 
          },
          name: { type: String, required: true },
          phone: { type: String, required: true },
          flatNumber: { type: String, required: true },
          blockNumber: { type: String, required: true },
          floorNumber: { type: String, required: true }
        },
        notes: { type: String },
        deliveryDetails: {
          company: { type: String },
          packageDetails: { type: String }
        }
      }
    ],
    dailySummary: {
      totalVisitors: { type: Number, default: 0 },
      currentVisitors: { type: Number, default: 0 },
      totalExited: { type: Number, default: 0 },
      overstayedVisitors: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true,
    indexes: [
      { date: 1, societyId: 1 },
      { 'visitors.status': 1 },
      { 'visitors.visitorType': 1 },
      { 'visitors.entryTime': 1 },
      { 'visitors.actualExitTime': 1 }
    ]
  }
);

// Add index for efficient querying
DailyAttendanceSchema.index({ date: 1, societyId: 1 });

// Middleware to update dailySummary counts before saving
DailyAttendanceSchema.pre('save', function(next) {
  const visitors = this.visitors || [];
  this.dailySummary = {
    totalVisitors: visitors.length,
    currentVisitors: visitors.filter(v => v.status === 'Inside').length,
    totalExited: visitors.filter(v => v.status === 'Left').length,
    overstayedVisitors: visitors.filter(v => v.status === 'Overstayed').length
  };
  next();
});

export default mongoose.models.DailyAttendance || mongoose.model('DailyAttendance', DailyAttendanceSchema);