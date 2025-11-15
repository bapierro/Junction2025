import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { ArrowLeft, Mic, Square, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { env } from '../lib/env';
import type { AgentState } from './ui/orb';
import { Button } from './ui/button';

interface RecordingScreenProps {
  onFinish: (transcript: string, audioBlob?: Blob) => void;
  onCancel: () => void;
}

const SAMPLE_TRANSCRIPT = `I remember it was a beautiful summer day in 1965. I was just 23 years old, and I had just started my first teaching job at the elementary school in my hometown. The children were so eager to learn, and I felt this overwhelming sense of purpose. My mother had always told me that teaching was a noble profession, and standing there in that classroom, I finally understood what she meant. The smell of chalk dust, the sound of children's laughter - these became the soundtrack of my life for the next 40 years. I wouldn't trade those memories for anything in the world.`;

type ConversationState = 'idle' | 'connecting' | 'recording' | 'paused';

const PROMPTS = [
  "Let's capture a memory. Tell me about a meaningful moment.",
  'Who was there with you?',
  'How old were you then?',
  'What did it feel like?',
  'What happened next?'
];

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export function RecordingScreen({ onFinish, onCancel }: RecordingScreenProps) {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(() => new Array(40).fill(0));
  const [currentPrompt, setCurrentPrompt] = useState<string>(PROMPTS[0]);
  const [showPrompt, setShowPrompt] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendUserTranscript = useCallback((snippet?: string) => {
    const trimmed = snippet?.trim();
    if (!trimmed) return;
    setTranscript((current) => (current ? `${current} ${trimmed}` : trimmed));
  }, []);

  const { startSession, endSession, status } = useConversation({
    onMessage: ({ message, source }) => {
      if (source === 'user') {
        appendUserTranscript(message);
      }
    },
    onModeChange: ({ mode }) => {
      if (mode === 'speaking') {
        setAgentState('talking');
      } else if (mode === 'listening') {
        setAgentState('listening');
      } else {
        setAgentState('thinking');
      }
    },
    onConnect: ({ conversationId }) => {
      setConversationState('recording');
      setAgentState('listening');
      setSessionId(conversationId ?? null);
      setElapsedSeconds(0);
      setError(null);
    },
    onDisconnect: () => {
      setAgentState(null);
      setConversationState((prev) => (prev === 'recording' ? 'paused' : 'idle'));
    },
    onError: (message) => {
      setError(message ?? 'Unable to communicate with the ElevenLabs agent.');
      setConversationState('idle');
      setAgentState(null);
    }
  });

  const canStart = Boolean(env.elevenLabsAgentId);
  const isConnected = status === 'connected';

  const stopSession = useCallback(async () => {
    await endSession().catch(() => {});
  }, [endSession]);
  const stopSessionRef = useRef(stopSession);
  useEffect(() => {
    stopSessionRef.current = stopSession;
  }, [stopSession]);

  const requestMicrophoneAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }
    await navigator.mediaDevices.getUserMedia({ audio: true });
  }, []);

  const fetchConversationToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/conversations/token', { method: 'POST' });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as { token?: string };
      if (!payload?.token || payload.token.startsWith('dev-token')) {
        return null;
      }
      return payload.token;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    if (status === 'connected') {
      waveTimerRef.current = setInterval(() => {
        setWaveformData((prev) => {
          const next = [...prev];
          next.shift();
          next.push(Math.random() * 0.8 + 0.2);
          return next;
        });
      }, 120);
    } else {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
      setWaveformData(new Array(40).fill(0));
    }

    return () => {
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }

    if (conversationState === 'recording') {
      setShowPrompt(false);
      promptTimerRef.current = setTimeout(() => {
        const nextPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        setCurrentPrompt(nextPrompt);
        setShowPrompt(true);
      }, 8000);
    } else if (conversationState === 'paused' || conversationState === 'idle') {
      setShowPrompt(true);
    }

    return () => {
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
        promptTimerRef.current = null;
      }
    };
  }, [conversationState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (waveTimerRef.current) {
        clearInterval(waveTimerRef.current);
      }
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
      stopSessionRef.current?.();
    };
  }, []);

  const handleToggleConversation = useCallback(async () => {
    if (isConnected) {
      setIsBusy(true);
      try {
        await stopSession();
      } finally {
        setIsBusy(false);
      }
      return;
    }

    if (!canStart) {
      setError('Set VITE_ELEVENLABS_AGENT_ID to enable the guided assistant.');
      return;
    }

    setIsBusy(true);
    setError(null);
    if (conversationState === 'idle') {
      setTranscript('');
      setElapsedSeconds(0);
    }
    setSessionId(null);
    setConversationState('connecting');
    setAgentState('thinking');

    try {
      await requestMicrophoneAccess();
      const token = await fetchConversationToken();
      if (token) {
        await startSession({ conversationToken: token, connectionType: 'webrtc' });
      } else if (env.elevenLabsAgentId) {
        await startSession({ agentId: env.elevenLabsAgentId, connectionType: 'webrtc' });
      } else {
        throw new Error('Unable to determine which ElevenLabs agent to use.');
      }
    } catch (err) {
      setConversationState('idle');
      setAgentState(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start the guided session. Check your ElevenLabs configuration.'
      );
      await stopSession();
    } finally {
      setIsBusy(false);
    }
  }, [
    canStart,
    conversationState,
    fetchConversationToken,
    isConnected,
    requestMicrophoneAccess,
    startSession,
    stopSession
  ]);

  const handleFinishRecording = useCallback(async () => {
    setIsBusy(true);
    try {
      if (status === 'connected' || status === 'connecting') {
        await stopSession();
      }
      const finalTranscript = transcript.trim();
      onFinish(finalTranscript || SAMPLE_TRANSCRIPT);
    } finally {
      setIsBusy(false);
      setConversationState('idle');
      setAgentState(null);
      setSessionId(null);
      setElapsedSeconds(0);
      setTranscript('');
      setError(null);
    }
  }, [onFinish, status, stopSession, transcript]);

  const handleUseSample = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') {
      await stopSession();
    }
    setConversationState('idle');
    setAgentState(null);
    setSessionId(null);
    setElapsedSeconds(0);
    setTranscript('');
    setError(null);
    onFinish(SAMPLE_TRANSCRIPT);
  }, [onFinish, status, stopSession]);

  const handleBack = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') {
      await stopSession();
    }
    onCancel();
  }, [onCancel, status, stopSession]);

  const statusMessage = useMemo(() => {
    if (error) {
      return error;
    }
    if (!canStart) {
      return 'Set VITE_ELEVENLABS_AGENT_ID to enable the guided assistant.';
    }
    if (status === 'connecting' || conversationState === 'connecting') {
      return 'Connecting to your StoryCircle guide…';
    }
    if (status === 'connected') {
      if (agentState === 'talking') {
        return 'StoryCircle is responding.';
      }
      if (agentState === 'listening') {
        return 'We are listening—share as much as you like.';
      }
      return 'Say hello to begin sharing your story.';
    }
    if (conversationState === 'paused' && transcript) {
      return 'Recording paused. Tap Resume to continue or finish below.';
    }
    if (transcript) {
      return 'Ready to publish your story? Tap Finish to continue.';
    }
    return 'Tap Start to begin talking to your StoryCircle guide.';
  }, [agentState, canStart, conversationState, error, status, transcript]);

  const canFinish = conversationState === 'paused' || elapsedSeconds > 10 || Boolean(transcript.trim());
  const recordButtonLabel = isConnected ? 'Pause recording' : conversationState === 'paused' ? 'Resume recording' : 'Start recording';
  const recordHelper = conversationState === 'recording'
    ? "I'll guide you if you pause"
    : conversationState === 'paused'
      ? 'Tap to continue'
      : 'Tap to start recording';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col p-6"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center mb-8"
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Go back"
          type="button"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
          <span className="text-amber-900">GO BACK</span>
        </button>
        <h2 className="flex-1 text-center text-amber-900 -mr-24">Record Your Story</h2>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-amber-900 mb-8 text-center"
        >
          <div className="inline-block px-6 py-3 bg-white/80 rounded-full shadow-md font-semibold">
            {formatDuration(elapsedSeconds)}
          </div>
        </motion.div>

        <div className="w-full h-24 mb-8 flex items-center justify-center gap-1 px-4">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-amber-600 rounded-full transition-all duration-100"
              style={{ height: `${height * 100}%`, opacity: isConnected ? 1 : 0.3 }}
            />
          ))}
        </div>

        {showPrompt && (
          <div className="mb-8 w-full">
            <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${error ? 'border-red-200 text-red-800 bg-red-50' : 'border-amber-200 text-amber-900'}`}>
              <p className="text-center">{error ? statusMessage : currentPrompt}</p>
            </div>
          </div>
        )}

        {!showPrompt && (
          <p className={`text-center mb-8 ${error ? 'text-red-700' : 'text-amber-800/80'}`}>{statusMessage}</p>
        )}

        <motion.div
          initial={{ scale: 0.7, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <button
            onClick={handleToggleConversation}
            disabled={isBusy || (!canStart && !isConnected)}
            className={`w-32 h-32 rounded-full shadow-2xl flex items-center justify-center transition-all ${
              isConnected
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : conversationState === 'paused'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-amber-600 hover:bg-amber-700'
            } ${isBusy ? 'opacity-70 pointer-events-none' : ''}`}
            aria-label={recordButtonLabel}
            type="button"
          >
            {isConnected ? (
              <Square className="w-12 h-12 text-white" fill="white" />
            ) : conversationState === 'paused' ? (
              <Play className="w-12 h-12 text-white" fill="white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </motion.div>

        <p className="text-amber-800/70 text-center mb-8">{recordHelper}</p>

        {canFinish && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-3">
            <Button
              onClick={handleFinishRecording}
              size="lg"
              className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white shadow-xl"
              disabled={isBusy}
            >
              Finish Story
            </Button>
            <button
              onClick={handleUseSample}
              className="w-full text-center text-amber-800/80 hover:text-amber-900 underline-offset-4 hover:underline"
              type="button"
              disabled={isBusy}
            >
              Use sample story instead
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
