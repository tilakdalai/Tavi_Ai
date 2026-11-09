import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: 'beam',
    },
    model: {
      type: String,
      default: 'beam:cloud',
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    requestStatus: {
      type: String,
      enum: ['success', 'failed', 'timeout'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

usageLogSchema.index({ createdAt: -1 });

const UsageLog = mongoose.models.UsageLog || mongoose.model('UsageLog', usageLogSchema);

export default UsageLog;

