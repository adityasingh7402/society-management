import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
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
  address: { type: String, required: true },
  unitNumber: { type: String, required: true },
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society',
    required: function() {
      return this.parentType === 'societyId'; // Only required if parentType is 'societyId'
    },
  },
  residentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resident',
    required: function() {
      return this.parentType === 'residentId'; // Only required if parentType is 'residentId'
    },
  },
  societyCode: { type: String, required: function() {
    return this.parentType === 'societyId'; // Required if parentType is 'societyId'
  }},
  residentCode: { type: String, required: function() {
    return this.parentType === 'residentId'; // Required if parentType is 'societyId'
  }},
//   societyName: { type: String, required: function() {
//     return this.parentType === 'societyId'; // Required if parentType is 'societyId'
//   }},
  tenantId: {
    type: String,
    default: function () {
      return `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; 
    },
  },
  parentType: { type: String, required: true }, // 'societyId' or 'residentId'
  societyName: { type: String, required: true },
  parentName: { type: String, required: true }, // Name of the parent (Society or Resident)
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

export default Tenant;
