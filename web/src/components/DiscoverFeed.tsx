import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StoryCard } from './StoryCard';
import { Search, Hash, Globe, Filter, X } from 'lucide-react';
import { getLocalizedCategory } from '../utils/bilingual';

export const DiscoverFeed: React.FC = () => {
  const { allStories, language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isBn = language === 'bn';

  // Extract all distinct hashtags from all stories
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allStories.forEach((s) => {
      (s.tags || []).forEach((t) => tagsSet.add(t));
      (s.interest_categories || []).forEach((c) => tagsSet.add(`#${c.replace(/_/g, '')}`));
    });
    return Array.from(tagsSet).slice(0, 16);
  }, [allStories]);

  // Extract distinct sources
  const allSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    allStories.forEach((s) => {
      (s.sources || []).forEach((src) => {
        if (src.name) sourcesSet.add(src.name);
      });
    });
    return Array.from(sourcesSet).slice(0, 8);
  }, [allStories]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    let result = allStories;

    if (selectedTag) {
      const cleanTag = selectedTag.toLowerCase().replace('#', '');
      result = result.filter((s) => {
        const hasTag = (s.tags || []).some((t) => t.toLowerCase().includes(cleanTag));
        const hasCat = (s.interest_categories || []).some((c) => c.toLowerCase().includes(cleanTag));
        return hasTag || hasCat;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const titleEn = s.daily_buzz.title_en?.toLowerCase() || '';
        const titleBn = s.daily_buzz.title_bn?.toLowerCase() || '';
        const summaryEn = s.daily_buzz.summary_en?.toLowerCase() || '';
        const summaryBn = s.daily_buzz.summary_bn?.toLowerCase() || '';
        const category = s.primary_category?.toLowerCase() || '';
        const sourceNames = (s.sources || []).map((src) => src.name?.toLowerCase()).join(' ');

        return (
          titleEn.includes(q) ||
          titleBn.includes(q) ||
          summaryEn.includes(q) ||
          summaryBn.includes(q) ||
          category.includes(q) ||
          sourceNames.includes(q)
        );
      });
    }

    return result;
  }, [allStories, searchQuery, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-36">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mint" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-card bg-obsidian-lowest/90 border border-white/[0.08] focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint text-white placeholder-text-secondary/60 text-sm sm:text-base backdrop-blur-xl transition-all shadow-xl"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Hashtags */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-bold text-mint uppercase tracking-wider mb-3">
          <Hash className="w-4 h-4" />
          <span>{isBn ? 'ট্রেন্ডিং বিষয় ও টপিক' : 'Trending Strategic Topics'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-mint text-obsidian-bg border-mint shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sources Pills */}
      {allSources.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            <Globe className="w-4 h-4" />
            <span>{isBn ? 'উৎস ও প্রকাশক অনুযায়ী' : 'Verified Publisher Desks'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allSources.map((src) => (
              <button
                key={src}
                onClick={() => setSearchQuery(src)}
                className="px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.06] text-xs text-text-secondary hover:text-mint hover:border-mint/30 transition-all"
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          {searchQuery || selectedTag
            ? isBn
              ? `খোঁজের ফলাফল (${filteredStories.length})`
              : `Search Results (${filteredStories.length})`
            : isBn
            ? `সাম্প্রতিক সব খবর (${filteredStories.length})`
            : `All Archive Briefs (${filteredStories.length})`}
        </h3>
        {(searchQuery || selectedTag) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            className="text-xs font-semibold text-mint hover:underline"
          >
            {isBn ? 'ফিল্টার সাফ করুন' : 'Clear Filters'}
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-card bg-white/[0.02] border border-white/[0.06]">
          <Search className="w-10 h-10 text-mint/40 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">
            {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching stories found'}
          </h4>
          <p className="text-xs text-text-secondary">
            {isBn ? 'অন্য কোনো অনুসন্ধান শব্দ ব্যবহার করুন' : 'Try adjusting your search terms or clearing your topic filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.story_id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};
