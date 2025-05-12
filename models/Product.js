import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  condition: { 
    type: String, 
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  location: {
    societyName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  sellerName: { type: String, required: true },
  sellerPhone: { type: String, required: true },
  sellerImage: { type: String },
  status: { 
    type: String, 
    enum: ['Available', 'Sold', 'Reserved'],
    default: 'Available'
  },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  productId: {
    type: String,
    unique: true,
    default: function () {
      const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `P-${timestamp}${randomNum}`;
    },
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }],
  comments: [{
    text: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    commenterName: { type: String, required: true },
    commenterImage: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 