import mongoose from 'mongoose';

const searchSourcesSchema = new mongoose.Schema(
  {
    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SearchHistory',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    snippet: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
    },
    retrievedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

searchSourcesSchema.index({ searchId: 1, retrievedAt: -1 });

const SearchSources =
  mongoose.models.SearchSources || mongoose.model('SearchSources', searchSourcesSchema);

export default SearchSources;

