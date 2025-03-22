import mongoose from 'mongoose';

const MaintenanceBillSchema = new mongoose.Schema({
  // References
  societyId: { type: String, required: true }, // Society ID
  flatId: { type: String, required: true }, // Flat ID
  flatNumber: { type: String, required: true }, // Flat number for easier querying/display
  blockName: { type: String, required: true }, // Block name
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }, // Resident reference

  // Bill Type (matches your form options)
  billType: {
    type: String,
    required: true,
    enum: ['Water', 'Electricity', 'Maintenance', 'Other'], // Matches your form options
  },

  // Bill details
  description: { type: String }, // Description of the bill
  amount: { type: Number, required: true }, // Total amount for the bill

  // Dates
  issueDate: { type: Date, default: Date.now }, // Date when the bill was issued
  dueDate: { type: Date, required: true }, // Due date for payment

  // Late payment
  finePerDay: { type: Number, default: 0 }, // Fine per day for late payment
  currentPenalty: { type: Number, default: 0 }, // Current penalty amount

  // Status
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Overdue', 'Partially Paid'], // Bill status
    default: 'Pending',
  },
  amountPaid: { type: Number, default: 0 }, // Amount paid so far
  remainingAmount: { type: Number }, // Remaining amount to be paid

  // Payment history
  paymentHistory: [
    {
      amount: Number,
      paymentDate: Date,
      paymentMethod: String,
      transactionId: String,
    },
  ],

  // Additional fields
  additionalCharges: [
    {
      description: String,
      amount: Number,
    },
  ],
}, { timestamps: true });

const MaintenanceBill = mongoose.models.MaintenanceBill || mongoose.model('MaintenanceBill', MaintenanceBillSchema);
export default MaintenanceBill;