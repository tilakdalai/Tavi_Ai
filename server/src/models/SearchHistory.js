import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    searchMode: {
      type: String,
      enum: ['auto', 'web', 'ai_only'],
      default: 'auto',
    },
    category: {
      type: String,
      default: 'general',
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    providerUsed: {
      type: String,
      default: 'duckduckgo',
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ userId: 1, createdAt: -1 });

const SearchHistory =
  mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;

