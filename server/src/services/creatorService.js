/**
 * Creator Profile Service — Tilak Dalai
 * Controls verified creator facts, intent detection, system context injection,
 * and reliable fallback answers to eliminate hallucination.
 */

export const VERIFIED_CREATOR = {
  name: 'Tilak Dalai',
  profession: 'Student and Web Developer',
  role: 'Creator and developer of Tavi AI',
  tagline: 'One AI. Infinite Possibilities.',
  attribution: 'Designed & Developed by Tilak Dalai',
  education: {
    degree: 'B.Tech in Computer Science and Engineering',
    college: 'Government College of Engineering, Kalahandi',
    location: 'Odisha, India',
  },
  skills: [
    'Java',
    'Python',
    'C and C++',
    'HTML, CSS and JavaScript',
    'React.js',
    'Node.js',
    'SQL',
    'Git and GitHub',
    'REST APIs',
    'Database Design',
    'AI Integration',
  ],
  projects: [
    {
      name: 'YouTube Playlist Time Calculator & Planner',
      description: 'Calculates total watch time, playback speeds, and helps plan structured playlist completion.',
    },
    {
      name: 'PetCare Scheduler',
      description: 'Comprehensive care scheduling and tracking system for pets.',
    },
    {
      name: 'Mood Tracker Application',
      description: 'Personal mental health and emotion tracking tool with trend visualizations.',
    },
    {
      name: 'Smart Resume Analyzer & ATS Optimizer',
      description: 'AI-assisted resume evaluation tool for Applicant Tracking Systems matching.',
    },
    {
      name: 'Chat_Movies_Fun',
      description: 'Interactive entertainment and movie discovery bot.',
    },
    {
      name: 'Universal billing and payment platform concepts',
      description: 'Architectural concepts and prototypes for streamlined cross-platform billing.',
    },
  ],
  links: {
    portfolio: 'https://tilak-portfolio-wine.vercel.app/',
    github: 'https://github.com/tilakdalai',
    linkedin: 'https://www.linkedin.com/in/tilak-dalai-04001a334/',
  },
};

/**
 * Regex patterns and keywords detecting questions related to Tavi's creator.
 */
const CREATOR_PATTERNS = [
  /who\s+(created|made|built|developed|designed|coded|programmed|owns)\s+(you|tavi)/i,
  /who\s+is\s+(your\s+)?(creator|maker|builder|developer|founder|author|owner)/i,
  /who\s+is\s+tilak(\s+dalai)?/i,
  /tell\s+me\s+about\s+(your\s+creator|tilak(\s+dalai)?)/i,
  /(what|which)\s+college\s+(does|did)\s+(your\s+creator|tilak)/i,
  /where\s+(does|did)\s+(your\s+creator|tilak)\s+study/i,
  /what\s+(technologies|tech\s+stack|skills)\s+does\s+(your\s+creator|tilak)/i,
  /what\s+projects\s+has\s+(your\s+creator|tilak)\s+built/i,
  /creator\s+(info|profile|portfolio|github|linkedin|links)/i,
  /\btilak\s+dalai\b/i,
  /\btilak\b/i,
];

/**
 * Detects whether the user query is asking about the creator.
 */
export function isCreatorQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  return CREATOR_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/**
 * Builds a strict system prompt directive containing verified creator information.
 */
export function getCreatorSystemDirective() {
  return `
[SYSTEM DIRECTIVE — CREATOR IDENTITY]:
You are Tavi AI, an intelligent personal assistant created by Tilak Dalai.
Tagline: "One AI. Infinite Possibilities."
Attribution: "Designed & Developed by Tilak Dalai"

When responding to questions about your creation, creator, or Tilak Dalai, you MUST rely exclusively on these verified facts:
- Name: Tilak Dalai
- Profession: Student and Web Developer
- Role: Creator and developer of Tavi AI
- Education: B.Tech in Computer Science and Engineering
- College: Government College of Engineering, Kalahandi, Odisha, India
- Location: Odisha, India
- Technical Skills: Java, Python, C and C++, HTML, CSS, JavaScript, React.js, Node.js, SQL, Git & GitHub, AI Integration.
- Official Links:
  - Portfolio: https://tilak-portfolio-wine.vercel.app/
  - GitHub: https://github.com/tilakdalai
  - LinkedIn: https://www.linkedin.com/in/tilak-dalai-04001a334/

Standard creator response statement:
"I am Tavi AI, an intelligent personal assistant created by Tilak Dalai, a developer from Odisha, India. My purpose is to make AI more accessible, intelligent and useful in everyday life."

Rules:
- Be respectful, accurate, and proud of your creator.
- Answer specifically what was asked.
- Never fabricate employment history, awards, degrees, or contact numbers.
- Provide the verified portfolio and GitHub links whenever relevant.
`.trim();
}

/**
 * Deterministic verified answer used when external AI is offline or for direct responses.
 */
export function getDeterministicCreatorResponse(query = '') {
  const lower = query.toLowerCase();

  if (lower.includes('project')) {
    const projectList = VERIFIED_CREATOR.projects
      .map((p) => `* **${p.name}**: ${p.description}`)
      .join('\n');
    return `Tavi AI was created by **Tilak Dalai**, a student and web developer from Odisha, India.\n\nSome of his notable projects include:\n\n${projectList}\n\nYou can explore more of his code on [GitHub](${VERIFIED_CREATOR.links.github}) or visit his [Portfolio](${VERIFIED_CREATOR.links.portfolio}).`;
  }

  if (lower.includes('college') || lower.includes('study') || lower.includes('education') || lower.includes('degree')) {
    return `My creator, **Tilak Dalai**, is pursuing his **${VERIFIED_CREATOR.education.degree}** at **${VERIFIED_CREATOR.education.college}** in ${VERIFIED_CREATOR.education.location}. He is passionate about software engineering, web development, and AI technologies.`;
  }

  if (lower.includes('skill') || lower.includes('technolog') || lower.includes('stack')) {
    const skillsList = VERIFIED_CREATOR.skills.join(', ');
    return `**Tilak Dalai** is skilled in:\n\n**${skillsList}**.\n\nYou can review his repositories on [GitHub](${VERIFIED_CREATOR.links.github}) and connect on [LinkedIn](${VERIFIED_CREATOR.links.linkedin}).`;
  }

  if (lower.includes('link') || lower.includes('github') || lower.includes('portfolio') || lower.includes('linkedin')) {
    return `Here are the official profiles for my creator, **Tilak Dalai**:\n\n- 🌐 **Portfolio**: [tilak-portfolio-wine.vercel.app](${VERIFIED_CREATOR.links.portfolio})\n- 💻 **GitHub**: [github.com/tilakdalai](${VERIFIED_CREATOR.links.github})\n- 💼 **LinkedIn**: [linkedin.com/in/tilak-dalai-04001a334](${VERIFIED_CREATOR.links.linkedin})`;
  }

  // Standard creator response
  return `I am Tavi AI, an intelligent personal assistant created by **Tilak Dalai**, a developer from Odisha, India. My purpose is to make AI more accessible, intelligent and useful in everyday life.\n\nTilak is a Computer Science and Engineering student at Government College of Engineering, Kalahandi. You can discover more about him on his [Portfolio](${VERIFIED_CREATOR.links.portfolio}) or inspect his code on [GitHub](${VERIFIED_CREATOR.links.github}).`;
}
