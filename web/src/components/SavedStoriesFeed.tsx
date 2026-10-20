import React from 'react';
import { useApp } from '../context/AppContext';
import { StoryCard } from './StoryCard';
import { Bookmark, Trash2, Download, BookOpen } from 'lucide-react';

export const SavedStoriesFeed: React.FC = () => {
  const { allStories, savedStoryIds, clearSaved, setActiveTab, language, t } = useApp();
  const isBn = language === 'bn';

  const savedStories = allStories.filter((s) => savedStoryIds.includes(s.story_id));

  const handleExport = () => {
    const content = savedStories
      .map(
        (s) =>
          `# ${s.daily_buzz.title_en}\n${s.daily_buzz.summary_en}\nWhy it matters: ${s.daily_buzz.why_it_matters_en}\nPublished: ${s.published_at}\n\n`
      )
      .join('---\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dorpon-reading-list-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-36">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-6 rounded-card bg-obsidian-lowest/80 border border-white/[0.08] backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-mint/15 border border-mint/30 text-mint">
            <Bookmark className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t('saved')}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              {savedStories.length} {isBn ? 'টি সংবাদ সংরক্ষিত রয়েছে' : 'articles saved for offline reading'}
            </p>
          </div>
        </div>

        {savedStories.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/[0.08] transition-all"
              title="Export Reading List"
            >
              <Download className="w-3.5 h-3.5 text-mint" />
              <span>{isBn ? 'তালিকা ডাউনলোড' : 'Export .MD'}</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(isBn ? 'আপনি কি নিশ্চিত সব সংরক্ষিত খবর মুছে ফেলতে চান?' : 'Are you sure you want to remove all saved stories?')) {
                  clearSaved();
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
              title="Clear Saved Stories"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সব মুছুন' : 'Clear All'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid or Empty State */}
      {savedStories.length === 0 ? (
        <div className="text-center py-24 px-4 rounded-card bg-white/[0.02] border border-white/[0.06]">
          <div className="w-16 h-16 rounded-full bg-mint/10 border border-mint/20 text-mint flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t('empty_saved_title')}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
            {t('empty_saved_desc')}
          </p>
          <button
            onClick={() => setActiveTab('top_stories')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-mint text-obsidian-bg text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-mint-bright transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isBn ? 'প্রধান খবর পড়ুন' : 'Browse Top Stories'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedStories.map((story) => (
            <StoryCard key={story.story_id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};
