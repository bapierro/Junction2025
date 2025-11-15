import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RecordingScreen } from './components/RecordingScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ShareConfirmationScreen } from './components/ShareConfirmationScreen';
import { StoryWallScreen } from './components/StoryWallScreen';
import { StoryDetailScreen } from './components/StoryDetailScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Toaster } from './components/ui/sonner';

export type Screen = 
  | 'welcome'
  | 'recording'
  | 'review'
  | 'share-confirmation'
  | 'story-wall'
  | 'story-detail'
  | 'settings';

export interface Story {
  id: string;
  title: string;
  transcript: string;
  ageRange?: string;
  city?: string;
  tags: string[];
  isAnonymous: boolean;
  reactions: {
    moved: number;
    thankYou: number;
    favorite: number;
  };
  audioUrl?: string;
  createdAt: Date;
  rawTranscript?: string;
  backendId?: number;
  abstract?: string | null;
  shareToken?: string | null;
}

export interface UserSettings {
  defaultAnonymous: boolean;
  ageRange: string;
  city: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [currentStory, setCurrentStory] = useState<Partial<Story> | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isStoryGenerating, setIsStoryGenerating] = useState(false);
  const [storyGenerationError, setStoryGenerationError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultAnonymous: false,
    ageRange: '',
    city: ''
  });

  const updateStory = (updates: Partial<Story>) => {
    setCurrentStory((prev) => {
      if (!prev) {
        return updates;
      }
      return { ...prev, ...updates };
    });
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleStartRecording = () => {
    setCurrentStory(null);
    navigateTo('recording');
  };

  const generateStoryFromTranscript = async (transcriptValue: string, snapshot?: Partial<Story>) => {
    const trimmed = transcriptValue.trim();
    if (!trimmed) return;
    setIsStoryGenerating(true);
    setStoryGenerationError(null);

    const storySnapshot = snapshot ?? currentStory ?? undefined;
    const body = {
      transcript: trimmed,
      title: storySnapshot?.title || 'My Story',
      age_range: userSettings.ageRange || undefined,
      city: userSettings.city || undefined,
      tags: storySnapshot?.tags || [],
    };

    try {
      const response = await fetch('/stories/from-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof payload?.detail === 'string' ? payload.detail : 'Unable to craft your story.';
        throw new Error(message);
      }
      updateStory({
        id: payload?.id ? String(payload.id) : storySnapshot?.id || Date.now().toString(),
        backendId: payload?.id ?? storySnapshot?.backendId,
        title: payload?.title || storySnapshot?.title || 'My Story',
        transcript: payload?.text || storySnapshot?.transcript || trimmed,
        rawTranscript: trimmed,
        abstract: payload?.abstract ?? storySnapshot?.abstract,
        ageRange: payload?.age_range ?? storySnapshot?.ageRange ?? userSettings.ageRange,
        city: payload?.city ?? storySnapshot?.city ?? userSettings.city,
        tags: payload?.tags ?? storySnapshot?.tags ?? [],
        audioUrl: payload?.audio_url ?? storySnapshot?.audioUrl,
        shareToken: payload?.share_token ?? storySnapshot?.shareToken ?? null,
        reactions: storySnapshot?.reactions || { moved: 0, thankYou: 0, favorite: 0 },
        isAnonymous: storySnapshot?.isAnonymous ?? userSettings.defaultAnonymous,
        createdAt: payload?.created_at ? new Date(payload.created_at) : storySnapshot?.createdAt || new Date()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to craft your story.';
      setStoryGenerationError(message);
    } finally {
      setIsStoryGenerating(false);
    }
  };

  const handleFinishRecording = (transcript: string, audioBlob?: Blob) => {
    const createdAt = new Date();
    const baseStory: Partial<Story> = {
      id: Date.now().toString(),
      transcript: transcript.trim(),
      rawTranscript: transcript.trim(),
      title: 'My Story',
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      tags: [],
      isAnonymous: userSettings.defaultAnonymous,
      reactions: { moved: 0, thankYou: 0, favorite: 0 },
      ageRange: userSettings.ageRange,
      city: userSettings.city,
      createdAt
    };
    updateStory(baseStory);
    setStoryGenerationError(null);
    navigateTo('review');
    void generateStoryFromTranscript(transcript, baseStory);
  };

  const handleSaveStory = async (story: Partial<Story>, shareType: 'private' | 'link' | 'public') => {
    const finalStory: Story = {
      id: story.id || Date.now().toString(),
      title: story.title || 'Untitled Story',
      transcript: story.transcript || '',
      ageRange: userSettings.ageRange,
      city: userSettings.city,
      tags: story.tags || [],
      isAnonymous: userSettings.defaultAnonymous,
      reactions: story.reactions || { moved: 0, thankYou: 0, favorite: 0 },
      audioUrl: story.audioUrl,
      createdAt: story.createdAt || new Date(),
      backendId: story.backendId,
      rawTranscript: story.rawTranscript || story.transcript
    };

    const visibility =
      shareType === 'public' ? 'public_anon' : shareType === 'link' ? 'link' : 'private';

    if (finalStory.backendId) {
      try {
        await fetch(`/stories/${finalStory.backendId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: finalStory.title,
            text: finalStory.transcript,
            tags: finalStory.tags,
            age_range: finalStory.ageRange,
            city: finalStory.city,
            visibility
          })
        });
      } catch (error) {
        console.error('Failed to update story visibility', error);
      }
    }

    if (shareType === 'public' || shareType === 'link') {
      navigateTo('share-confirmation');
    } else {
      navigateTo('welcome');
    }
  };

  const handleViewStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    navigateTo('story-detail');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onTellStory={handleStartRecording}
            onListenToStories={() => navigateTo('story-wall')}
            onOpenSettings={() => navigateTo('settings')}
          />
        );
      case 'recording':
        return (
          <RecordingScreen
            onFinish={handleFinishRecording}
            onCancel={() => navigateTo('welcome')}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            story={currentStory}
            onSave={handleSaveStory}
            onCancel={() => navigateTo('welcome')}
            onUpdateStory={updateStory}
            isStoryGenerating={isStoryGenerating}
            storyGenerationError={storyGenerationError}
            onRetryGenerate={() => {
              if (currentStory?.rawTranscript) {
                void generateStoryFromTranscript(currentStory.rawTranscript);
              }
            }}
          />
        );
      case 'share-confirmation':
        return (
          <ShareConfirmationScreen
            onGoToStoryWall={() => navigateTo('story-wall')}
            onBackToHome={() => navigateTo('welcome')}
          />
        );
      case 'story-wall':
        return (
          <StoryWallScreen
            onViewStory={handleViewStory}
            onBack={() => navigateTo('welcome')}
          />
        );
      case 'story-detail':
        return (
          <StoryDetailScreen
            storyId={selectedStoryId}
            onBack={() => navigateTo('story-wall')}
            onListenToSimilar={(id) => handleViewStory(id)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={userSettings}
            onSave={(settings) => {
              setUserSettings(settings);
              navigateTo('welcome');
            }}
            onCancel={() => navigateTo('welcome')}
          />
        );
      default:
        return <WelcomeScreen onTellStory={handleStartRecording} onListenToStories={() => navigateTo('story-wall')} onOpenSettings={() => navigateTo('settings')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {renderScreen()}
      <Toaster />
      {isStoryGenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-900/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 text-center text-amber-900 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto" />
            <p className="font-semibold">Shaping your StoryCircle narrative…</p>
            <p className="text-sm text-amber-700">This only takes a few seconds.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
