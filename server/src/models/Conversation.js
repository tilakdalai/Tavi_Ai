import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID (Firebase UID) is required'],
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: [120, 'Conversation title cannot exceed 120 characters'],
    },
    model: {
      type: String,
      default: 'beam:cloud',
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, isArchived: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
