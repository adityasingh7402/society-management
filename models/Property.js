import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  propertyType: { 
    type: String,
    enum: ['Apartment', 'Studio', 'Garage', 'Single Room', 'Shop', 'Office Space'],
    required: true
  },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  area: { 
    type: Number, 
    required: true 
  },
  furnishingStatus: {
    type: String,
    enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
    required: true
  },
  amenities: [{
    type: String
  }],
  location: {
    societyName: { type: String, required: true },
    block: { type: String, required: true },
    floor: { type: String, required: true },
    flatNumber: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Available', 'Under Contract', 'Sold'],
    default: 'Available'
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  }],
  comments: [{
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true
    },
    residentName: { type: String, required: true },
    residentImage: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  interestedBuyers: [{
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['Interested', 'Scheduled Visit', 'Negotiating', 'Offer Made', 'Rejected', 'Accepted'],
      default: 'Interested'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sellerName: { type: String, required: true },
  sellerPhone: { type: String, required: true },
  sellerImage: { type: String },
  propertyId: {
    type: String,
    unique: true,
    default: function () {
      const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `PROP-${timestamp}${randomNum}`;
    },
  },
});

propertySchema.set('toJSON', { virtuals: true });
propertySchema.set('toObject', { virtuals: true });

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);

export default Property; 