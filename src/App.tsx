import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import {
  defaultGradientConfig,
  type GradientVariant,
  WebGLGradient,
} from './WebGLGradient';

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionResultLike = {
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const glassConfig = {
  alpha: 4,
  blur: 7,
  saturation: 154,
  edgeGlow: 0.78,
  topThickness: 0.55,
  bottomThickness: 1.27,
  sideThickness: 0.5,
  darkDepth: 1.32,
  refraction: 0.08,
  bevelDepth: 0.12,
  bevelWidth: 0.15,
  frost: 2,
  magnify: 1.1,
  specular: 1,
};

const variants: GradientVariant[] = [
  'option1',
  'option2',
  'option3',
  'option4',
  'option5',
  'option6',
];

export function App() {
  const [variant, setVariant] = useState<GradientVariant>('option1');
  const [previousVariant, setPreviousVariant] = useState<GradientVariant | null>(null);
  const [revealPoint, setRevealPoint] = useState({ x: '50%', y: '50%' });
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transitionTimeoutRef = useRef(0);

  const changeVariant = (
    nextVariant: GradientVariant,
    point: { x: string; y: string } = { x: '50%', y: '50%' },
  ) => {
    if (nextVariant === variant) return;
    window.clearTimeout(transitionTimeoutRef.current);
    setRevealPoint(point);
    setPreviousVariant(variant);
    setVariant(nextVariant);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setPreviousVariant(null);
    }, 460);
  };

  const cycleVariant = (point?: { x: string; y: string }) => {
    const currentIndex = variants.findIndex((item) => item === variant);
    const next = variants[(currentIndex + 1) % variants.length];
    changeVariant(next, point);
  };

  const handleScreenClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    cycleVariant({
      x: `${((event.clientX - rect.left) / rect.width) * 100}%`,
      y: `${((event.clientY - rect.top) / rect.height) * 100}%`,
    });
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setSpeechText('');
    setSpeechError('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let nextText = '';
      for (let index = 0; index < event.results.length; index += 1) {
        nextText += event.results[index][0].transcript;
      }
      setSpeechText(nextText.trim());
    };
    recognition.onerror = () => {
      setSpeechError('Microphone permission or speech recognition failed.');
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    setSpeechError('');
    setSpeechText('');
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(
    () => () => {
      window.clearTimeout(transitionTimeoutRef.current);
      stopListening();
    },
    [],
  );

  const screenStyle = {
    '--reveal-x': revealPoint.x,
    '--reveal-y': revealPoint.y,
  } as CSSProperties;

  return (
    <main className="page-shell">
      <section className="phone-stage" aria-label="WebGL gradient container">
        <div className="phone">
          <div
            className={previousVariant ? 'phone-screen is-switching' : 'phone-screen'}
            onClick={handleScreenClick}
            role="button"
            style={screenStyle}
            tabIndex={0}
          >
            {previousVariant && (
              <div className="gradient-layer gradient-layer-previous">
                <WebGLGradient config={defaultGradientConfig} glass={glassConfig} variant={previousVariant} />
              </div>
            )}
            <div className="gradient-layer gradient-layer-current">
              <WebGLGradient config={defaultGradientConfig} glass={glassConfig} variant={variant} />
            </div>
            {previousVariant && (
              <>
                <div className="gradient-transition-clip" aria-hidden="true" />
                <div className="gradient-transition-bloom" aria-hidden="true" />
              </>
            )}
            <div className="liquid-glass-bg liquid-glass-cover" aria-hidden="true" />
            {(speechText || speechError || isListening) && (
              <div className="speech-transcript">
                {speechError || speechText || 'Listening...'}
              </div>
            )}
          </div>
          <button
            aria-label={isListening ? 'Stop speech recognition' : 'Start speech recognition'}
            aria-pressed={isListening}
            className="bottom-action-button"
            onClick={toggleListening}
            type="button"
          >
            {isListening ? (
              <svg className="bottom-action-icon" width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M22.5791 7.07077C22.8069 6.84297 22.8069 6.47362 22.5791 6.24581L21.7542 5.42085C21.5264 5.19305 21.157 5.19305 20.9292 5.42085L14 12.3501L7.07077 5.42086C6.84297 5.19305 6.47362 5.19305 6.24581 5.42086L5.42085 6.24581C5.19305 6.47362 5.19305 6.84297 5.42085 7.07077L12.3501 14L5.42085 20.9292C5.19305 21.157 5.19305 21.5264 5.42085 21.7542L6.24581 22.5791C6.47362 22.807 6.84296 22.807 7.07077 22.5791L14 15.6499L20.9292 22.5791C21.157 22.807 21.5264 22.807 21.7542 22.5791L22.5791 21.7542C22.8069 21.5264 22.8069 21.157 22.5791 20.9292L15.6499 14L22.5791 7.07077Z" fill="black" />
              </svg>
            ) : (
              <svg className="bottom-action-icon" width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M4.19367 10.0013C3.72859 10.0013 3.35156 10.3783 3.35156 10.8434V21.1592C3.35156 21.6243 3.72859 22.0013 4.19367 22.0013H6.50946C6.97454 22.0013 7.35156 21.6243 7.35156 21.1592V10.8434C7.35156 10.3783 6.97454 10.0013 6.50946 10.0013H4.19367Z" fill="black" />
                <path d="M17.5716 10.8434C17.5716 10.3783 17.9486 10.0013 18.4137 10.0013H20.7295C21.1946 10.0013 21.5716 10.3783 21.5716 10.8434V23.8259C21.5716 24.2909 21.1946 24.668 20.7295 24.668H18.4137C17.9486 24.668 17.5716 24.2909 17.5716 23.8259V10.8434Z" fill="black" />
                <path d="M25.527 14.0013C25.0619 14.0013 24.6849 14.3783 24.6849 14.8434V19.8259C24.6849 20.2909 25.0619 20.668 25.527 20.668H27.8428C28.3079 20.668 28.6849 20.2909 28.6849 19.8259V14.8434C28.6849 14.3783 28.3079 14.0013 27.8428 14.0013H25.527Z" fill="black" />
                <path d="M10.4648 3.51007C10.4648 3.04499 10.8419 2.66797 11.3069 2.66797H13.6227C14.0878 2.66797 14.4648 3.04499 14.4648 3.51007V28.4925C14.4648 28.9576 14.0878 29.3346 13.6227 29.3346H11.3069C10.8419 29.3346 10.4648 28.9576 10.4648 28.4925V3.51007Z" fill="black" />
              </svg>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
