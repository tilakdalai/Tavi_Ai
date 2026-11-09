/**
 * Tavi AI Voice & Speech Synthesis Service
 * Provides natural multilingual Text-to-Speech (TTS) with sweet feminine voice profiles.
 * Automatically detects script/language and matches the optimal female voice.
 * Designed & Developed by Tilak Dalai
 */

class VoiceService {
  constructor() {
    this.voices = [];
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.chunkIndex = 0;
    this.chunks = [];
    this.currentCallbacks = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  /**
   * Cache available browser voices
   */
  initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices() || [];
  }

  /**
   * Get cached voices or query directly
   */
  getAvailableVoices() {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }
    return this.voices;
  }

  /**
   * Detect language and script from text content
   * @param {string} text
   * @returns {{ lang: string, name: string }}
   */
  detectLanguage(text = '') {
    if (!text) return { lang: 'en-US', name: 'English' };

    // Odia (Oriya) script: U+0B00 to U+0B7F
    if (/[\u0B00-\u0B7F]/.test(text)) {
      return { lang: 'or-IN', name: 'Odia' };
    }

    // Devanagari script (Hindi, Marathi, Sanskrit, Nepali): U+0900 to U+097F
    if (/[\u0900-\u097F]/.test(text)) {
      return { lang: 'hi-IN', name: 'Hindi' };
    }

    // Bengali / Assamese script: U+0980 to U+09FF
    if (/[\u0980-\u09FF]/.test(text)) {
      return { lang: 'bn-IN', name: 'Bengali' };
    }

    // Telugu script: U+0C00 to U+0C7F
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return { lang: 'te-IN', name: 'Telugu' };
    }

    // Tamil script: U+0B80 to U+0BFF
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return { lang: 'ta-IN', name: 'Tamil' };
    }

    // Kannada script: U+0C80 to U+0CFF
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return { lang: 'kn-IN', name: 'Kannada' };
    }

    // Malayalam script: U+0D00 to U+0D7F
    if (/[\u0D00-\u0D7F]/.test(text)) {
      return { lang: 'ml-IN', name: 'Malayalam' };
    }

    // Gujarati script: U+0A80 to U+0AFF
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return { lang: 'gu-IN', name: 'Gujarati' };
    }

    // Gurmukhi / Punjabi script: U+0A00 to U+0A7F
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return { lang: 'pa-IN', name: 'Punjabi' };
    }

    // Japanese: Hiragana, Katakana, Kanji
    if (/[\u3040-\u30FF\u31F0-\u31FF\u4E00-\u9FAF]/.test(text)) {
      return { lang: 'ja-JP', name: 'Japanese' };
    }

    // Korean: Hangul
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
      return { lang: 'ko-KR', name: 'Korean' };
    }

    // Chinese: Han
    if (/[\u4E00-\u9FFF]/.test(text)) {
      return { lang: 'zh-CN', name: 'Chinese' };
    }

    // Arabic / Urdu: U+0600 to U+06FF
    if (/[\u0600-\u06FF]/.test(text)) {
      return { lang: 'ar-SA', name: 'Arabic' };
    }

    // Cyrillic / Russian: U+0400 to U+04FF
    if (/[\u0400-\u04FF]/.test(text)) {
      return { lang: 'ru-RU', name: 'Russian' };
    }

    // Spanish keywords/accents
    if (/[áéíóúñ¿¡]/i.test(text)) {
      return { lang: 'es-ES', name: 'Spanish' };
    }

    // French keywords/accents
    if (/[àâçèéêëîïôûùüÿœæ]/i.test(text)) {
      return { lang: 'fr-FR', name: 'French' };
    }

    // German keywords/accents
    if (/[äöüß]/i.test(text)) {
      return { lang: 'de-DE', name: 'German' };
    }

    // Default English
    return { lang: 'en-US', name: 'English' };
  }

  /**
   * Find the sweetest, most natural feminine voice for the given language
   * @param {string} targetLang - e.g. 'or-IN', 'hi-IN', 'en-US'
   * @returns {SpeechSynthesisVoice|null}
   */
  findSweetFeminineVoice(targetLang = 'en-US') {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    const baseLang = targetLang.split('-')[0].toLowerCase();

    // Regex for preferred feminine, sweet, and natural voice names
    const femaleNameRegex = /(female|girl|woman|sweet|natural|neural|jenny|aria|zira|samantha|victoria|karen|swara|neerja|heera|lekha|moira|tessa|ava|allison|susan|kavya|kalpana|maya|shruti|geeta|priya|ananya)/i;

    // 1. First priority: Exact language match + known natural feminine voice
    const exactFemaleMatch = voices.find((v) => {
      const matchLang = v.lang.toLowerCase() === targetLang.toLowerCase();
      return matchLang && (femaleNameRegex.test(v.name) || v.name.toLowerCase().includes('female'));
    });
    if (exactFemaleMatch) return exactFemaleMatch;

    // 2. Second priority: Base language match (e.g. 'hi', 'en', 'es') + feminine name
    const baseFemaleMatch = voices.find((v) => {
      const vBase = v.lang.split('-')[0].toLowerCase();
      return vBase === baseLang && (femaleNameRegex.test(v.name) || v.name.toLowerCase().includes('female'));
    });
    if (baseFemaleMatch) return baseFemaleMatch;

    // 3. Third priority: Any voice matching exact language
    const anyExactLangMatch = voices.find(
      (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
    );
    if (anyExactLangMatch) return anyExactLangMatch;

    // 4. Fourth priority: Any voice matching base language
    const anyBaseLangMatch = voices.find(
      (v) => v.lang.split('-')[0].toLowerCase() === baseLang
    );
    if (anyBaseLangMatch) return anyBaseLangMatch;

    // 5. Special fallback for Indian languages (Odia, Telugu, etc. if browser has no native voice):
    // Fall back to Hindi or Indian English female voice for authentic phonetic pronunciation
    if (['or', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'bn'].includes(baseLang)) {
      const indianFemaleVoice = voices.find(
        (v) =>
          (v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().includes('hi')) &&
          femaleNameRegex.test(v.name)
      );
      if (indianFemaleVoice) return indianFemaleVoice;
    }

    // 6. Ultimate sweet feminine fallback (e.g. English Jenny, Aria, Zira, Samantha)
    const fallbackSweetVoice = voices.find((v) => femaleNameRegex.test(v.name));
    if (fallbackSweetVoice) return fallbackSweetVoice;

    // 7. Last resort: default voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  /**
   * Clean and normalize raw markdown text into crystal-clear speech text
   * @param {string} rawText
   * @returns {string}
   */
  cleanTextForSpeech(rawText = '') {
    if (!rawText) return '';

    return rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' [code block skipped] ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove reference citation markers like [1], [2], [Source 1], [1](https://...)
      .replace(/\[\d+\](?:\([^)]+\))?/g, '')
      .replace(/\[Source\s*\d+\](?:\([^)]+\))?/gi, '')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown headings (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold and italics (*, _, **)
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove blockquotes (>)
      .replace(/^>\s+/gm, '')
      // Remove markdown table lines
      .replace(/\|/g, ' ')
      .replace(/-{3,}/g, '')
      // Remove list dashes and bullets
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove emojis and miscellaneous decorative Unicode
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ''
      )
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split text into conversational sentences to prevent browser TTS cutoffs
   * @param {string} text
   * @returns {string[]}
   */
  splitIntoSentences(text = '') {
    if (!text) return [];
    // Match sentence terminators (. ? ! । etc.) followed by space or end
    const rawChunks = text.match(/[^.!?।;\n]+(?:[.!?।;\n]+|$)/g) || [text];
    const cleanChunks = [];

    for (const chunk of rawChunks) {
      const trimmed = chunk.trim();
      if (trimmed.length > 0) {
        // If a single sentence is excessively long (>200 chars), break by comma
        if (trimmed.length > 200) {
          const subParts = trimmed.split(/,\s+/);
          subParts.forEach((p) => {
            const pt = p.trim();
            if (pt) cleanChunks.push(pt);
          });
        } else {
          cleanChunks.push(trimmed);
        }
      }
    }

    return cleanChunks.length > 0 ? cleanChunks : [text];
  }

  /**
   * Speak the given text with a sweet feminine voice and accurate language matching
   * @param {string} text - text to speak
   * @param {Object} options - voice options (pitch, rate, onStart, onEnd, onError)
   */
  speak(text, options = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options.onError) {
        options.onError(new Error('Speech synthesis is not supported in this browser.'));
      }
      return;
    }

    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Auto-detect language
    const detected = this.detectLanguage(cleanText);
    const targetLang = options.lang || detected.lang;
    const voice = options.voice || this.findSweetFeminineVoice(targetLang);

    // Sweet girl voice settings: pitch slightly higher (1.14), gentle pace (0.97)
    const pitch = options.pitch !== undefined ? options.pitch : 1.14;
    const rate = options.rate !== undefined ? options.rate : 0.97;
    const volume = options.volume !== undefined ? options.volume : 1.0;

    this.chunks = this.splitIntoSentences(cleanText);
    this.chunkIndex = 0;
    this.isSpeaking = true;
    this.currentCallbacks = options;

    if (options.onStart) options.onStart({ lang: targetLang, voiceName: voice?.name });

    this._speakNextChunk(voice, targetLang, pitch, rate, volume);
  }

  /**
   * Internal recursive chunk speaker
   */
  _speakNextChunk(voice, lang, pitch, rate, volume) {
    if (!this.isSpeaking || this.chunkIndex >= this.chunks.length) {
      this.isSpeaking = false;
      if (this.currentCallbacks?.onEnd) {
        this.currentCallbacks.onEnd();
      }
      return;
    }

    const chunkText = this.chunks[this.chunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    utterance.lang = lang;
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onend = () => {
      this.chunkIndex++;
      this._speakNextChunk(voice, lang, pitch, rate, volume);
    };

    utterance.onerror = (e) => {
      // Ignore user cancellation errors
      if (e.error === 'canceled' || e.error === 'interrupted') {
        this.isSpeaking = false;
        return;
      }
      console.warn('[VoiceService] Utterance error:', e.error);
      this.chunkIndex++;
      this._speakNextChunk(voice, lang, pitch, rate, volume);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any current speech playback immediately
   */
  stop() {
    this.isSpeaking = false;
    this.chunkIndex = 0;
    this.chunks = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentCallbacks?.onEnd) {
      this.currentCallbacks.onEnd();
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
