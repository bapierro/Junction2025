import { useEffect, useRef, useState } from 'react';

interface AIAssistantProps {
  onCreateAccount: () => void;
  onSkipAccount: () => void;
  onStartStory: () => void;
  onListenToStories: () => void;
  isFirstBoot: boolean;
  hasAccount: boolean;
}

type ConversationStep = 'welcome' | 'ask-account' | 'account-created' | 'main-menu';

/**
 * The ElevenLabs-based assistant runs invisibly in the background. We only emulate
 * its dialogue timing here so that audio/speech backends can hook in later
 * without changing the UI code again.
 */
export function AIAssistant({
  onCreateAccount,
  onSkipAccount,
  onStartStory,
  onListenToStories,
  isFirstBoot,
  hasAccount
}: AIAssistantProps) {
  const [currentStep, setCurrentStep] = useState<ConversationStep>(isFirstBoot ? 'welcome' : 'main-menu');
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const queueTimeout = (cb: () => void, delay: number) => {
      const id = window.setTimeout(cb, delay);
      timeoutsRef.current.push(id);
    };

    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];

    if (isFirstBoot) {
      queueTimeout(() => setCurrentStep('welcome'), 200);
      queueTimeout(() => setCurrentStep('ask-account'), 4300);
    } else {
      queueTimeout(() => setCurrentStep('main-menu'), 400);
    }

    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [isFirstBoot]);

  // Hooks reserved for ElevenLabs prompts in a future iteration.
  useEffect(() => {
    if (currentStep === 'account-created') {
      onCreateAccount();
    }
  }, [currentStep, onCreateAccount]);

  useEffect(() => {
    if (!isFirstBoot) {
      return;
    }
    const idleTimer = window.setTimeout(() => {
      onSkipAccount();
    }, 20000);
    return () => window.clearTimeout(idleTimer);
  }, [isFirstBoot, onSkipAccount]);

  useEffect(() => {
    // Placeholder: future ElevenLabs voice commands can tap into these refs.
  }, [onStartStory, onListenToStories, hasAccount]);

  // Render nothing – the orb/voice is handled elsewhere.
  return null;
}
