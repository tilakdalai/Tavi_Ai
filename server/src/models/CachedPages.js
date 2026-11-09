import mongoose from 'mongoose';

const cachedPagesSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
    },
    domain: {
      type: String,
      default: '',
    },
    extractedContent: {
      type: String,
      required: true,
    },
    contentHash: {
      type: String,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expires: '1s' }, // TTL index auto-deletes expired records
    },
  },
  {
    timestamps: true,
  }
);

const CachedPages =
  mongoose.models.CachedPages || mongoose.model('CachedPages', cachedPagesSchema);

export default CachedPages;

