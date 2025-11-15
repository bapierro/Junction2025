import { useState } from 'react';
import { ArrowLeft, Play, Pause, Heart, HandHeart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MOCK_STORIES } from '../lib/mockData';

interface StoryDetailScreenProps {
  storyId: string | null;
  onBack: () => void;
  onListenToSimilar: (storyId: string) => void;
}

export function StoryDetailScreen({ storyId, onBack, onListenToSimilar }: StoryDetailScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reactions, setReactions] = useState({
    moved: false,
    thankYou: false,
    favorite: false
  });

  const story = MOCK_STORIES.find(s => s.id === storyId) || MOCK_STORIES[0];
  const ageDescriptor = story.ageRange ? `${story.ageRange}-year-old` : 'Storyteller';
  const cityDescriptor = story.city || 'their community';

  const handleReaction = (type: 'moved' | 'thankYou' | 'favorite') => {
    setReactions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getSimilarStoryId = () => {
    const otherStories = MOCK_STORIES.filter(s => s.id !== storyId);
    return otherStories[Math.floor(Math.random() * otherStories.length)]?.id || '2';
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-3 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-7 h-7 text-amber-900" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6 pb-6">
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
          className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
        >
          Listen to Similar Story
        </Button>
      </div>
    </div>
  );
}
