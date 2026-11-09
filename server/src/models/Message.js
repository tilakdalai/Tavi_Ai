import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'assistant', 'system'],
        message: '{VALUE} is not a valid message role',
      },
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: [30000, 'Message content cannot exceed 30,000 characters'],
    },
    attachments: [
      {
        name: { type: String, required: true },
        type: { type: String, default: 'text/plain' },
        size: { type: Number, default: 0 },
        textContent: { type: String, default: '' },
      },
    ],
    feedback: {
      type: String,
      enum: ['like', 'dislike', null],
      default: null,
    },
    citations: [
      {
        title: { type: String },
        url: { type: String },
        snippet: { type: String },
        domain: { type: String },
        favicon: { type: String },
      },
    ],
    requestStatus: {
      type: String,
      enum: ['pending', 'completed', 'error'],
      default: 'completed',
    },
    modelMetadata: {
      model: {
        type: String,
        default: 'beam:cloud',
      },
      provider: {
        type: String,
        default: 'beam',
      },
      tokensUsed: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, conversationId: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
