# TAVI AI — THE NEXT-GENERATION PERSONAL AI ASSISTANT

> **One AI. Infinite Possibilities.**  
> **Designed & Developed by [Tilak Dalai](https://github.com/tilakdalai)**

---

## 🌟 Executive Overview

**Tavi AI** is a production-grade personal AI assistant combining high-speed conversational reasoning, real-time live web search & scraping, automatic multilingual voice synthesis, long-term memory persistence, document understanding, and full PWA installability.

Built from the ground up with an original brand identity, glassmorphic dark/light aesthetics, and privacy-first local authentication, Tavi gives users an intelligent companion that can think, browse, summarize, and speak naturally in English, Odia (ଓଡ଼ିଆ), Hindi, and global languages.

---

## 🚀 Key Features

### 1. 🌐 Real-Time Web Search & Scraping Engine
- **Live Internet Grounding:** Natural-language search with multi-source retrieval (DuckDuckGo, Wikipedia, Cheerio, Axios).
- **Source Verification:** Collapsible, verified source citation cards with favicons, domain metadata, and direct page links.
- **SSRF Protection:** Built-in IP address and loopback validator preventing SSRF vulnerabilities.
- **Multi-Search Modes:** Switch between **Auto Search** (smart trigger for current events), **Force Web Search**, and **AI Only**.

### 2. 🎙️ Sweet Multilingual Voice Engine
- **Sweet Feminine Voice Persona:** Automatically selects melodic, natural female voices (*Microsoft Jenny*, *Aria*, *Google Female*, *Samantha*, *Victoria*, *Neerja*, *Swara*).
- **Automatic Language Detection:** Dynamically detects unicode scripts to speak fluently in:
  - **ଓଡ଼ିଆ (Odia):** Authentic Indian phonetic cadence.
  - **हिंदी / संस्कृत (Hindi / Sanskrit):** Native pronunciation.
  - **English, Spanish, French, German, Japanese, and more.**
- **Speech Cleaner & Sentence Chunking:** Filters out raw markdown syntax, URLs, and citation brackets, preventing the browser 15-second TTS timeout.
- **Customizable Tone in Settings:** Choose between *Calm & Soft*, *Sweet & Warm*, or *Bright & Melodic* with a live test preview.

### 3. 🔒 Privacy-First Native Authentication
- **Zero Configuration Barrier:** Start chatting immediately as an **Explorer** without external popup blockers or cloud authentication accounts.
- **Data Isolation:** User conversations, personal memories, and custom preferences are strictly segregated by user ID.
- **Local Persistence & Sync:** High-speed local database fallback (`tavi_local_db.json`) ensuring chat history and active sessions survive restarts.

### 4. 🧠 Long-Term Memory Engine
- **Explicit Memory Storage:** Retains user facts, programming styles, personal preferences, and language directions.
- **Full User Control:** View, search, add, delete, or clear memories anytime via the Memory Modal.

### 5. 📱 Progressive Web App (PWA) Installable
- **Native App Feel:** One-click "Install App" button in navigation bar and sidebar.
- **Cross-Platform:** Installable on Windows, macOS, Android, and iOS home screens.
- **Offline Shell & Fast Caching:** Custom Service Worker (`sw.js`) and Web App Manifest (`manifest.webmanifest`).

### 6. 🎨 Modern Responsive UI
- **Dual Theme Support:** Seamless Dark Midnight and Clean Light themes with zero flash.
- **Framer Motion Animations:** Smooth transitions, collapsible source drawers, and interactive quick-start prompts.
- **Document Attachments:** Upload `.txt`, `.json`, `.csv`, `.md`, and code files directly in the chat composer.

---

## 🛠️ Architecture & Tech Stack

```
Tavi/
├── client/                      # React 18 SPA (Vite + Tailwind CSS + Framer Motion)
│   ├── public/                  # PWA Manifest, Service Worker, Logos & Icons
│   ├── src/
│   │   ├── assets/              # Brand logo images & media assets
│   │   ├── components/
│   │   │   ├── auth/            # Native Login & Profile Creation View
│   │   │   ├── chat/            # Composer, MessageList, MessageItem (Collapsible Sources)
│   │   │   ├── common/          # BrandLogo, FadeContent
│   │   │   ├── layout/          # Sidebar (search, history, pin, archive)
│   │   │   ├── loading/         # MultilingualLoader (12 scripts)
│   │   │   └── modals/          # Settings, Memory, About, InstallApp, Admin
│   │   ├── context/             # AuthContext (Native), ThemeContext
│   │   └── services/            # API client, VoiceService (Sweet TTS)
│   └── package.json
│
├── server/                      # Node.js + Express REST API & Real-Time SSE
│   ├── src/
│   │   ├── config/              # MongoDB Atlas, AI Model configurations
│   │   ├── middleware/          # requireAuth, rateLimiter, errorHandler
│   │   ├── models/              # User, Conversation, Message, Memory
│   │   ├── modules/
│   │   │   ├── search/          # Search router, aggregator, DDG & Wiki providers
│   │   │   └── scraper/         # Cheerio content extractor & SSRF protection
│   │   ├── routes/              # chat, conversations, user, memory, health, admin
│   │   └── services/            # aiService, memoryService, store (local disk DB sync)
│   ├── tests/                   # Automated Node test suites (auth, health, chat, search, etc.)
│   └── package.json
│
├── .gitignore                   # Multi-tier ignore rules protecting all secrets
├── .env.example                 # Environment configuration template
└── package.json                 # Monorepo root scripts
```

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 2. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/tilakdalai/tavi-ai.git
cd tavi-ai
npm run install:all
```

### 3. Environment Setup

Create your environment configuration:

```bash
cp .env.example server/.env
```

Configure your preferred AI API key in `server/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Ollama Cloud / Beam Cloud (Recommended)
OLLAMA_API_KEY=your_ollama_cloud_api_key_here
OLLAMA_MODEL=beam:cloud

# Or Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running Locally

Start both backend and frontend concurrently:

```bash
npm run dev
```

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **Health Endpoint:** `http://localhost:5000/api/health`

### 5. Running Tests

Execute the automated backend test suites:

```bash
npm run test:server
```

---

## 🚀 Git & Deployment Guide

To push this repository to GitHub:

```bash
# 1. Initialize git
git init -b main

# 2. Stage all project files (secrets & node_modules are automatically ignored)
git add .

# 3. Commit changes
git commit -m "feat: complete Tavi AI production release with live search, sweet voice, and native auth"

# 4. Link your GitHub remote repository
git remote add origin https://github.com/your-username/tavi-ai.git

# 5. Push to GitHub
git push -u origin main
```

---

## 📄 License & Attribution

Designed & Developed by **Tilak Dalai**  
Licensed under the [MIT License](LICENSE).
