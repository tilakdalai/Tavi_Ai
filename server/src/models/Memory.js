import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required for memory storage'],
      index: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Memory content cannot be empty'],
      trim: true,
      maxlength: [1000, 'Individual memory content cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: ['preference', 'fact', 'work', 'custom'],
      default: 'fact',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ userId: 1, isActive: 1, createdAt: -1 });

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);

export default Memory;

