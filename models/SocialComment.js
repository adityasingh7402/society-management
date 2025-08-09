import mongoose from 'mongoose';

const socialCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialPost',
    required: [true, 'Please provide post ID']
  },
  content: {
    type: String,
    required: [true, 'Please provide comment content'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['Resident', 'Society']
  },
  authorName: {
    type: String,
    required: true
  },
  authorImage: {
    type: String,
    default: ''
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
  // For nested comments/replies
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialComment',
    default: null
  },
  repliesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies
socialCommentSchema.virtual('replies', {
  ref: 'SocialComment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Index for better performance
socialCommentSchema.index({ postId: 1, createdAt: -1 });
socialCommentSchema.index({ parentComment: 1 });

export default mongoose.models.SocialComment || mongoose.model('SocialComment', socialCommentSchema);
