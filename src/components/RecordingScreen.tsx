import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { ArrowLeft } from 'lucide-react';
import { env } from '../lib/env';
import { Orb, type AgentState } from './ui/orb';
import { Button } from './ui/button';

interface RecordingScreenProps {
  onFinish: (transcript: string, audioBlob?: Blob) => void;
  onCancel: () => void;
}

const SAMPLE_TRANSCRIPT = `I remember it was a beautiful summer day in 1965. I was just 23 years old, and I had just started my first teaching job at the elementary school in my hometown. The children were so eager to learn, and I felt this overwhelming sense of purpose. My mother had always told me that teaching was a noble profession, and standing there in that classroom, I finally understood what she meant. The smell of chalk dust, the sound of children's laughter - these became the soundtrack of my life for the next 40 years. I wouldn't trade those memories for anything in the world.`;

type ConversationState = 'idle' | 'connecting' | 'recording' | 'paused';

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendUserTranscript = useCallback((snippet?: string) => {
    const trimmed = snippet?.trim();
    if (!trimmed) return;
    setTranscript((current) => (current ? `${current} ${trimmed}` : trimmed));
  }, []);

  const { startSession, endSession, status, getInputVolume, getOutputVolume } = useConversation({
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
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
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

  const primaryActionLabel = useMemo(() => {
    if (isConnected) {
      return 'Pause Recording';
    }
    if (conversationState === 'paused') {
      return 'Resume Recording';
    }
    return 'Start Recording';
  }, [conversationState, isConnected]);

  const statusColor = error ? 'text-red-700' : 'text-amber-800/80';

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          className="p-3 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
        </button>
        <h2 className="flex-1 text-center text-amber-900 -ml-12">Record Your Story</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <p className="text-amber-800/80 text-center mb-6 px-6">
          Use the StoryCircle guide to share your story in your own words. The orb shows when we&apos;re
          listening or speaking back to you.
        </p>

        <div className="text-amber-900 mb-8 text-center">
          <div className="inline-block px-6 py-3 bg-white/80 rounded-full shadow-md font-semibold">
            {formatDuration(elapsedSeconds)}
          </div>
          {sessionId ? (
            <p className="text-xs text-amber-800/70 mt-2">Session: {sessionId}</p>
          ) : null}
        </div>

        <div className="mb-8 w-full flex justify-center">
          <Orb
            className="h-56 w-56 drop-shadow-xl"
            agentState={agentState}
            getInputVolume={getInputVolume}
            getOutputVolume={getOutputVolume}
            colors={['#f59e0b', '#f97316']}
          />
        </div>

        <p className={`text-center mb-6 min-h-[48px] px-6 ${statusColor}`}>{statusMessage}</p>

        <div className="w-full space-y-3 mb-8">
          <Button
            onClick={handleToggleConversation}
            size="lg"
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white shadow-lg disabled:opacity-60 disabled:pointer-events-none"
            disabled={isBusy || (!canStart && !isConnected)}
          >
            {primaryActionLabel}
          </Button>

          <Button
            onClick={handleFinishRecording}
            size="lg"
            variant="outline"
            className="w-full h-14 border-amber-600 text-amber-900"
            disabled={isBusy}
          >
            Finish Recording
          </Button>

          <Button
            onClick={handleUseSample}
            size="lg"
            variant="ghost"
            className="w-full h-14"
            disabled={isBusy}
          >
            Use Sample Story Instead
          </Button>
        </div>
      </div>
    </div>
  );
}
