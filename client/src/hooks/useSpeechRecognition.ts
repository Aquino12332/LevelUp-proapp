import { useState, useEffect, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function useSpeechRecognition({
  onTranscript,
  onError,
  continuous = false,
  language = 'en-US',
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  
  // Use refs for callbacks to avoid recreating speech recognition on callback changes
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interim += transcriptPart;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          if (onTranscriptRef.current) {
            onTranscriptRef.current(finalTranscript.trim());
          }
        }
        
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        // Ignore 'aborted' errors as they're expected when stopping
        if (event.error === 'aborted') {
          setIsListening(false);
          return;
        }
        
        const errorMessage = event.error === 'no-speech' 
          ? 'No speech detected. Please try again.'
          : event.error === 'not-allowed'
          ? 'Microphone access denied. Please allow microphone access.'
          : event.error === 'audio-capture'
          ? 'No microphone found. Please connect a microphone.'
          : event.error === 'network'
          ? 'Network error. Please check your internet connection.'
          : `Speech recognition error: ${event.error}`;
        
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
    } else {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      // Only cleanup if component is unmounting, not on every re-render
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [continuous, language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error: any) {
        console.error('Error starting speech recognition:', error);
        // Handle case where recognition is already started
        if (error.message && error.message.includes('already started')) {
          console.log('Speech recognition already active');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
