/**
 * Web Speech Synthesis utility for spoken Mandi Gate Announcements
 * and Interactive Voice Response (IVR) prompts in Hindi/Indian English.
 */
export type RegionalLanguage = 'hi-IN' | 'pa-IN' | 'mr-IN' | 'te-IN' | 'en-IN';

class SpeechVoiceManager {
  public enabled: boolean = true;

  public speak(text: string, lang: RegionalLanguage = 'en-IN') {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly slower and clearer for elderly farmers
      utterance.pitch = 1.0;
      utterance.lang = lang;

      // Try to find a matching regional or Indian voice if available in the browser
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => 
        v.lang === lang || 
        v.lang.toLowerCase().startsWith(lang.slice(0, 2)) ||
        v.lang.toLowerCase().includes('in') || 
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('hindi')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis failed silently
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechVoice = new SpeechVoiceManager();
