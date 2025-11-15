import { useState } from 'react';
import { Play, Pause, Heart, HandHeart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MOCK_STORIES, MY_STORIES } from '../lib/mockData';

interface StoryDetailScreenProps {
  storyId: string | null;
  onBack: () => void;
  onListenToSimilar: (storyId: string) => void;
  onHome?: () => void;
}

export function StoryDetailScreen({ storyId, onBack, onListenToSimilar, onHome }: StoryDetailScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reactions, setReactions] = useState({
    moved: false,
    thankYou: false,
    favorite: false
  });

  const allStories = [...MOCK_STORIES, ...MY_STORIES];
  const story = allStories.find((s) => s.id === storyId) || allStories[0];
  const ageDescriptor = story.ageRange ? `${story.ageRange}-year-old` : 'Storyteller';
  const cityDescriptor = story.city || 'their community';

  const handleReaction = (type: 'moved' | 'thankYou' | 'favorite') => {
    setReactions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getSimilarStoryId = () => {
    const otherStories = allStories.filter((s) => s.id !== storyId);
    return otherStories[Math.floor(Math.random() * otherStories.length)]?.id || '2';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="bg-white shadow-sm border-b-2 border-amber-200 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={onHome ?? onBack}
            className="px-4 py-3 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors shadow-md"
            aria-label="Go back"
          >
            <span className="text-amber-900 text-sm font-semibold">GO BACK</span>
          </button>
          <h1 className="text-amber-900">Story</h1>
          {onHome ? (
            <button
              onClick={onBack}
              className="px-4 py-3 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors shadow-md"
              aria-label="See more stories"
            >
              <span className="text-amber-900 text-sm font-semibold">SEE MORE STORIES</span>
            </button>
          ) : (
            <div className="w-28" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto w-full space-y-6 pb-6">
          {/* Title */}
          <div>
            <h1 className="text-amber-900 mb-3">{story.title}</h1>
          <p className="text-amber-800/70">
            {ageDescriptor} from {cityDescriptor}
          </p>
          <div className="flex gap-2 mt-3">
            {story.tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-amber-100 text-amber-900 border-amber-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-700 flex items-center justify-center shadow-md transition-colors flex-shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white" fill="white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all"
                  style={{ width: isPlaying ? '35%' : '0%' }}
                />
              </div>
              <p className="text-amber-800/70 mt-2">Listen to the full story</p>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-amber-200">
          <div className="prose prose-amber max-w-none">
            {story.transcript.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="text-amber-900 mb-4 last:mb-0 whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Reactions */}
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-amber-200">
          <p className="text-amber-900 mb-4">How does this story make you feel?</p>
          <div className="space-y-3">
            <button
              onClick={() => handleReaction('moved')}
              className={`w-full h-16 rounded-xl flex items-center justify-between px-5 transition-all ${
                reactions.moved
                  ? 'bg-rose-100 border-2 border-rose-400'
                  : 'bg-amber-50 border-2 border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className={`w-7 h-7 ${reactions.moved ? 'text-rose-600' : 'text-amber-700'}`} />
                <span className="text-amber-900">This moved me</span>
              </div>
              <span className="text-amber-800/70">{story.reactions.moved + (reactions.moved ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => handleReaction('thankYou')}
              className={`w-full h-16 rounded-xl flex items-center justify-between px-5 transition-all ${
                reactions.thankYou
                  ? 'bg-blue-100 border-2 border-blue-400'
                  : 'bg-amber-50 border-2 border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <HandHeart className={`w-7 h-7 ${reactions.thankYou ? 'text-blue-600' : 'text-amber-700'}`} />
                <span className="text-amber-900">Thank you</span>
              </div>
              <span className="text-amber-800/70">{story.reactions.thankYou + (reactions.thankYou ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => handleReaction('favorite')}
              className={`w-full h-16 rounded-xl flex items-center justify-between px-5 transition-all ${
                reactions.favorite
                  ? 'bg-amber-200 border-2 border-amber-500'
                  : 'bg-amber-50 border-2 border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className={`w-7 h-7 ${reactions.favorite ? 'text-amber-700' : 'text-amber-700'}`} />
                <span className="text-amber-900">Favorite</span>
              </div>
              <span className="text-amber-800/70">{story.reactions.favorite + (reactions.favorite ? 1 : 0)}</span>
            </button>
          </div>
        </div>

          {/* Similar Story Button */}
          <Button
            onClick={() => onListenToSimilar(getSimilarStoryId())}
            size="lg"
            className="w-full h-20 bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
          >
            Listen to Similar Story
          </Button>
        </div>
      </div>
    </div>
  );
}
