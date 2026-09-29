import { useState, useRef, useEffect } from 'react';

export function useSpeechDictation(onResult: (text: string) => void, lang: string = 'hi-IN') {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onstart = () => setIsDictating(true);
      recognition.onend = () => setIsDictating(false);
      recognition.onerror = () => setIsDictating(false);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          onResult(text);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      // Ignore
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onResult]);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn('Dictation start err:', err);
      }
    }
  };

  return { isDictating, toggleDictation, isSupported: !!recognitionRef.current || typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) };
}
