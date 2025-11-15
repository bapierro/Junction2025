import { useEffect, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Badge } from './ui/badge';
import { MOCK_STORIES, MY_STORIES } from '../lib/mockData';

interface StoryWallScreenProps {
  onViewStory: (storyId: string) => void;
  onBack: () => void;
  defaultTab?: 'my-stories' | 'public-stories';
}

type TabType = 'my-stories' | 'public-stories';

export function StoryWallScreen({ onViewStory, onBack, defaultTab = 'public-stories' }: StoryWallScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const currentStories = activeTab === 'my-stories' ? MY_STORIES : MOCK_STORIES;

  const getPreview = (transcript: string) => {
    const firstSentence = transcript.split('\n\n')[0];
    return firstSentence.length > 100 ? `${firstSentence.substring(0, 100)}...` : firstSentence;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="bg-white shadow-sm border-b-2 border-amber-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors shadow-md"
            aria-label="Go back to home"
          >
            <ArrowLeft className="w-6 h-6 text-amber-900" />
            <span className="text-amber-900 text-sm font-semibold">GO BACK</span>
          </button>
          <h1 className="text-amber-900">Listen to Stories</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full p-5 space-y-5 pb-10">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('public-stories')}
              className={`h-16 rounded-2xl border-2 transition-all ${
                activeTab === 'public-stories'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-lg'
                  : 'bg-white border-amber-200 text-amber-900'
              }`}
            >
              Explore Story Wall
            </button>
            <button
              onClick={() => setActiveTab('my-stories')}
              className={`h-16 rounded-2xl border-2 transition-all ${
                activeTab === 'my-stories'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-lg'
                  : 'bg-white border-amber-200 text-amber-900'
              }`}
            >
              My Stories
            </button>
          </div>

          {currentStories.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-amber-200 shadow-md mt-8">
              <p className="text-amber-800">
                {activeTab === 'my-stories'
                  ? "You haven't recorded any stories yet."
                  : 'No public stories available right now.'}
              </p>
            </div>
          ) : (
            currentStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-5">
                  <h2 className="text-amber-900 mb-3">{story.title}</h2>
                  <p className="text-amber-800/80 mb-2">
                    {story.ageRange ? `${story.ageRange}-year-old` : 'Storyteller'} from {story.city || 'their community'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag) => (
                      <Badge key={tag} className="bg-amber-100 text-amber-900 border border-amber-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-amber-900/90 mb-5 leading-relaxed">{getPreview(story.transcript)}</p>

                <button
                  onClick={() => onViewStory(story.id)}
                  className="w-full h-20 rounded-2xl bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-4 shadow-md transition-colors"
                  aria-label={`Listen to ${story.title}`}
                >
                  <Play className="w-10 h-10 text-white" fill="white" />
                  <span className="text-white text-lg font-semibold">Listen to Story</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
