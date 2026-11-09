import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      trim: true,
    },
    firebaseUid: {
      type: String,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    photoURL: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    preferredLanguage: {
      type: String,
      default: 'en', // 'en', 'hi', 'hinglish', 'or' (Odia), 'sa' (Sanskrit), etc.
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['dark', 'light', 'system'],
        default: 'dark',
      },
      reducedMotion: {
        type: Boolean,
        default: false,
      },
      voiceAutoPlay: {
        type: Boolean,
        default: false,
      },
      memoryEnabled: {
        type: Boolean,
        default: true,
      },
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ firebaseUid: 1, email: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
