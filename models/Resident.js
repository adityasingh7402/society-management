import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
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
  unitNumber: { type: String, required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  societyCode: { type: String, required: true },
  societyName: { type: String, required: true },
  residentId: {
    type: String,
    unique: true,
    default: function () {
      return `R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
  },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
  societyVerification: {
    type: String,
    enum: ['Approved', 'Reject', 'Pending'],
    default: 'Pending',
  },
});

// Add a virtual field to fetch the resident's flat information
residentSchema.virtual('flat', {
  ref: 'Society', // Reference the Society model
  localField: '_id', // Resident's _id
  foreignField: 'apartmentStructure.blocks.flats.residents', // Path to the residents array in the Society model
  justOne: true, // Return only one flat (since a resident belongs to one flat)
});

// Enable virtuals to be included in JSON responses
residentSchema.set('toJSON', { virtuals: true });
residentSchema.set('toObject', { virtuals: true });

const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);

export default Resident;