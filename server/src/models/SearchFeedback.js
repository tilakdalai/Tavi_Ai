import mongoose from 'mongoose';

const searchFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    searchId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: String,
      enum: ['positive', 'negative', 'helpful', 'unhelpful'],
      required: true,
    },
    feedbackText: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

searchFeedbackSchema.index({ userId: 1, createdAt: -1 });

const SearchFeedback =
  mongoose.models.SearchFeedback || mongoose.model('SearchFeedback', searchFeedbackSchema);

export default SearchFeedback;

