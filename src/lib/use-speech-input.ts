"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The Web Speech API isn't part of every TypeScript DOM lib version in
 * a consistent way, so we declare just the pieces we actually use here,
 * rather than relying on ambient types that may or may not be present.
 */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

/**
 * Wraps the browser's built-in speech recognition. No backend call, no
 * AI-developer dependency - Chrome and Edge support this natively;
 * Firefox does not, hence the isSupported flag callers should check.
 */
export function useSpeechInput() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef<((transcript: string) => void) | null>(null);

  useEffect(() => {
    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(!!ctor);
  }, []);

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setError(null);
    onResultRef.current = onResult;

    const recognition = new SpeechRecognitionCtor();
    // "en-IN" - tuned for Indian English accents; most academic terms
    // come through in English even in otherwise-Hinglish speech.
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResultRef.current?.(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was blocked - allow it in your browser settings to use voice input.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("Something went wrong with voice input. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isListening, error, startListening, stopListening };
}