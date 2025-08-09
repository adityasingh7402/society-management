import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide content for the post'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  images: {
    type: [String], // Array of image URLs
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel' // Dynamic reference
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['Resident', 'Society'] // Can be either Resident or Society
  },
  authorName: {
    type: String,
    required: true
  },
  authorImage: {
    type: String,
    default: ''
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: [true, 'Please provide society ID']
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'likes.userModel'
    },
    userModel: {
      type: String,
      required: true,
      enum: ['Resident', 'Society']
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'deactivated'],
    default: 'active'
  },
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    default: null
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
socialPostSchema.virtual('comments', {
  ref: 'SocialComment',
  localField: '_id',
  foreignField: 'postId'
});

// Index for better performance
socialPostSchema.index({ societyId: 1, createdAt: -1 });
socialPostSchema.index({ status: 1 });

export default mongoose.models.SocialPost || mongoose.model('SocialPost', socialPostSchema);
