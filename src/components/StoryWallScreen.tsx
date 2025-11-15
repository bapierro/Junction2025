import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MOCK_STORIES } from '../lib/mockData';

interface StoryWallScreenProps {
  onViewStory: (storyId: string) => void;
  onBack: () => void;
}

const FILTER_OPTIONS = ['All', 'Childhood', 'Love', 'Work', 'Migration', 'Family', 'Adventure', 'Wisdom'];

export function StoryWallScreen({ onViewStory, onBack }: StoryWallScreenProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredStories = activeFilter === 'All' 
    ? MOCK_STORIES 
    : MOCK_STORIES.filter(story => story.tags.includes(activeFilter));

  const getPreview = (transcript: string) => {
    const firstSentence = transcript.split('\n\n')[0];
    return firstSentence.length > 120 ? firstSentence.substring(0, 120) + '...' : firstSentence;
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
        <h2 className="flex-1 text-center text-amber-900 -ml-12">Story Wall</h2>
      </div>

      {/* Filters */}
      <div className="mb-6 overflow-x-auto pb-2 -mx-6 px-6">
        <div className="flex gap-3 min-w-max">
          {FILTER_OPTIONS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-3 rounded-full whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-amber-900 border-2 border-amber-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Stories List */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-4 pb-6">
        {filteredStories.map(story => (
          <Card
            key={story.id}
            className="p-5 bg-white border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewStory(story.id)}
          >
            <h3 className="text-amber-900 mb-2">{story.title}</h3>
            <p className="text-amber-800/80 mb-4 line-clamp-2">
              {getPreview(story.transcript)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-amber-800/70">
                {(story.ageRange ? `${story.ageRange}-year-old` : 'Storyteller')} from {story.city || 'their community'}
              </span>
              <div className="flex gap-2">
                {story.tags.map(tag => (
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
          </Card>
        ))}

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-amber-800/70">
              No stories found with this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
