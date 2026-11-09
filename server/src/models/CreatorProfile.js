import mongoose from 'mongoose';

const creatorProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Tilak Dalai',
      required: true,
    },
    role: {
      type: String,
      default: 'Creator and developer of Tavi AI',
    },
    tagline: {
      type: String,
      default: 'Your AI. Your Ideas. Your World.',
    },
    education: {
      degree: {
        type: String,
        default: 'B.Tech in Computer Science and Engineering',
      },
      college: {
        type: String,
        default: 'Government College of Engineering, Kalahandi, Bhawanipatna, Odisha, India',
      },
    },
    technicalSkills: {
      type: [String],
      default: [
        'JavaScript',
        'React.js',
        'Node.js',
        'Express.js',
        'Python',
        'Java',
        'C',
        'C++',
        'REST APIs',
        'SQL & Database Design',
        'MongoDB',
        'AI Integration',
        'Web Application Development',
        'Software Architecture',
      ],
    },
    approvedProjects: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        url: { type: String },
      },
    ],
    publicLinks: {
      portfolio: {
        type: String,
        default: 'https://tilak-portfolio-wine.vercel.app/',
      },
      github: {
        type: String,
        default: 'https://github.com/tilakdalai',
      },
      linkedin: {
        type: String,
        default: 'https://www.linkedin.com/in/tilak-dalai-04001a334/',
      },
      leetcode: {
        type: String,
        default: 'https://leetcode.com/u/tilakdalai/',
      },
    },
    biography: {
      type: String,
      default:
        'Tilak Dalai is a Computer Science and Engineering student and full-stack software developer who built Tavi AI to deliver a fast, elegant, and personal conversational AI experience. He specializes in web architecture, AI integration, and modern frontend/backend frameworks.',
    },
  },
  {
    timestamps: true,
  }
);

const CreatorProfile =
  mongoose.models.CreatorProfile || mongoose.model('CreatorProfile', creatorProfileSchema);

export default CreatorProfile;

