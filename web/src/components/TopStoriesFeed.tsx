import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StoryCard } from './StoryCard';
import { BreakingWiresTicker } from './BreakingWiresTicker';
import { getLocalizedCategory } from '../utils/bilingual';
import { Sparkles, RefreshCw, Layers } from 'lucide-react';

const CATEGORIES = [
  'all',
  'international_diplomacy',
  'economy_business',
  'governance_law',
  'climate_delta',
  'tech_innovation',
  'sports_fitness',
  'pop_culture',
];

export const TopStoriesFeed: React.FC = () => {
  const { buzzStories, isLoading, refreshFeeds, language, t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isBn = language === 'bn';

  const filteredStories = useMemo(() => {
    if (selectedCategory === 'all') return buzzStories;
    return buzzStories.filter((s) => {
      const cat = s.primary_category.toLowerCase();
      const interests = (s.interest_categories || []).map((c) => c.toLowerCase());
      return cat === selectedCategory || interests.includes(selectedCategory);
    });
  }, [buzzStories, selectedCategory]);

  const featuredStory = filteredStories.length > 0 ? filteredStories[0] : null;
  const remainingStories = filteredStories.length > 1 ? filteredStories.slice(1) : [];

  return (
    <div className="pb-32">
      {/* Real-time Breaking Wires Banner */}
      <BreakingWiresTicker />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Category Horizontal Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-4 mb-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'all' ? t('filter_all') : getLocalizedCategory(cat, isBn);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  isSelected
                    ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Loading Skeletons */}
        {isLoading && buzzStories.length === 0 && (
          <div className="space-y-6 animate-pulse">
            <div className="h-72 rounded-card bg-white/[0.03] border border-white/[0.06]" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-card bg-white/[0.03] border border-white/[0.06]" />
              ))}
            </div>
          </div>
        )}

        {/* Stories Feed */}
        {!isLoading && filteredStories.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-card bg-white/[0.02] border border-white/[0.06]">
            <Layers className="w-12 h-12 text-mint/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">
              {isBn ? 'এই বিভাগে কোনো সংবাদ পাওয়া যায়নি' : 'No Stories in this Category'}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {isBn ? 'অন্য কোনো বিভাগ বেছে নিন অথবা ফিড রিফ্রেশ করুন' : 'Try selecting another category or refresh the feed.'}
            </p>
            <button
              onClick={() => refreshFeeds()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold hover:bg-mint/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBn ? 'পুনরায় লোড করুন' : 'Refresh Feeds'}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Top Featured Hero Story */}
            {featuredStory && (
              <StoryCard story={featuredStory} featured={true} />
            )}

            {/* Remaining Grid */}
            {remainingStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingStories.map((story) => (
                  <StoryCard key={story.story_id} story={story} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
