import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CapsuleStory } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  Scale, 
  BarChart3, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Bookmark, 
  Headphones, 
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { getLocalizedCategory, formatRelativeTime } from '../utils/bilingual';

export const CurrentAffairsFeed: React.FC = () => {
  const { currentAffairs, openStory, language, isSerif, isSaved, toggleSave, playStoryAudio, t } = useApp();
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(
    currentAffairs.length > 0 ? currentAffairs[0].story_id : null
  );

  const isBn = language === 'bn';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-36">
      {/* Header Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-card bg-gradient-to-br from-gold/15 via-gold/5 to-transparent border border-gold/30 shadow-[0_10px_35px_rgba(234,179,8,0.1)]">
        <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-wider mb-2">
          <Scale className="w-4 h-4" />
          <span>Strategic Dossiers & Current Affairs Intelligence</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3 ${isSerif ? 'font-serif' : 'font-sans'}`}>
          {isBn ? 'গভীর বিশ্লেষণ ও নীতি কৌশল রূপরেখা' : 'Deep-Dive Policy, Macroeconomy & Strategic Dossiers'}
        </h2>
        <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">
          {isBn
            ? 'সাংবিধানিক অনুচ্ছেদ, অফিসিয়াল পরিসংখ্যান, প্রধান সংকট ও দীর্ঘমেয়াদী সমাধান সম্বলিত সমন্বিত গবেষণা নথি।'
            : 'Multi-source analytical briefings designed for policymakers, researchers, and competitive examination scholars with constitutional citations, official telemetry, and policy roadmaps.'}
        </p>
      </div>

      {/* Dossiers List */}
      <div className="space-y-8">
        {currentAffairs.map((story) => {
          const bcs = story.bcs_pro;
          const buzz = story.daily_buzz;
          const headline = isBn
            ? (buzz.title_bn || buzz.title_en)
            : (buzz.title_en || buzz.title_bn);

          const whyInNews = isBn
            ? (bcs?.why_in_the_news_bn || buzz.summary_bn)
            : (bcs?.why_in_the_news_en || buzz.summary_en);

          const categoryLabel = getLocalizedCategory(story.primary_category, isBn);
          const timeFormatted = formatRelativeTime(story.published_at, isBn);
          const isExpanded = expandedStoryId === story.story_id;
          const bookmarked = isSaved(story.story_id);

          return (
            <div
              key={story.story_id}
              className="rounded-card bg-obsidian-lowest/90 border border-gold/20 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-300"
            >
              {/* Header section */}
              <div className="p-6 sm:p-8 border-b border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold-bright text-xs font-bold tracking-wide">
                      {bcs?.bcs_subject_area || 'Strategic Track'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold">
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => playStoryAudio(story)}
                      className="p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-mint/20 hover:border-mint/30 transition-all"
                      title="Listen"
                    >
                      <Headphones className="w-4 h-4 text-mint" />
                    </button>
                    <button
                      onClick={() => toggleSave(story.story_id)}
                      className={`p-2 rounded-full border transition-all ${
                        bookmarked
                          ? 'bg-gold/20 border-gold/40 text-gold'
                          : 'bg-white/[0.04] border-white/[0.08] text-text-secondary hover:text-white'
                      }`}
                      title={bookmarked ? 'Saved' : 'Save'}
                    >
                      <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => openStory(story)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gold text-obsidian-bg text-xs font-bold hover:bg-gold-bright transition-all"
                    >
                      <span>Study Canvas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3
                  onClick={() => openStory(story)}
                  className={`text-xl sm:text-2xl font-bold text-white hover:text-gold cursor-pointer leading-tight mb-4 transition-colors ${
                    isSerif ? 'font-serif' : 'font-sans'
                  }`}
                >
                  {headline}
                </h3>

                {/* Why in the news callout */}
                <div className="p-4 rounded-tile bg-white/[0.02] border border-white/[0.06] mb-6">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('why_in_the_news')}</span>
                  </div>
                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                    {whyInNews}
                  </p>
                </div>

                {/* Key Empirical Telemetry Data Points */}
                {bcs?.data_stats && bcs.data_stats.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 text-xs font-bold text-mint uppercase tracking-wider mb-3">
                      <BarChart3 className="w-4 h-4" />
                      <span>{t('stat_points')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {bcs.data_stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-tile bg-white/[0.02] border border-white/[0.06] hover:border-mint/30 transition-colors"
                        >
                          <div className="text-xl font-extrabold text-mint tracking-tight">
                            {stat.value}
                          </div>
                          <div className="text-xs font-semibold text-white mt-1">
                            {stat.metric_name}
                          </div>
                          <div className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
                            <span>{stat.context}</span>
                            <span className="text-text-tertiary">[{stat.source_org}]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constitutional Articles */}
                {bcs?.constitutional_articles && bcs.constitutional_articles.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-wider mb-3">
                      <Scale className="w-4 h-4" />
                      <span>{t('constitutional_articles')}</span>
                    </div>
                    <div className="space-y-2.5">
                      {bcs.constitutional_articles.map((art, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-tile bg-gold/5 border border-gold/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-1 rounded-md bg-gold/20 text-gold-bright text-xs font-mono font-bold">
                              {art.article_number}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {isBn ? art.article_title_bn : art.article_title_en}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary sm:text-right max-w-md">
                            {art.legal_relevance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggle Expansion for Deep Inquiries & Way Forward */}
                <button
                  onClick={() => setExpandedStoryId(isExpanded ? null : story.story_id)}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-tile bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white transition-all mt-4"
                >
                  <span>{isExpanded ? (isBn ? 'কম দেখান' : 'Collapse Deep Inquiries') : (isBn ? 'বিস্তারিত অনুসন্ধান ও সমাধান দেখুন' : 'Expand Strategic Inquiries & Solutions')}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div className="p-6 sm:p-8 bg-black/30 space-y-6 animate-fadeIn">
                  {/* Question Breakdowns */}
                  {bcs?.question_breakdowns && bcs.question_breakdowns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-mint" />
                        <span>{t('key_questions')}</span>
                      </h4>
                      <div className="space-y-4">
                        {bcs.question_breakdowns.map((q, idx) => (
                          <div key={idx} className="p-4 rounded-tile bg-white/[0.02] border border-white/[0.06]">
                            <p className="text-sm font-bold text-white mb-2">{q.question}</p>
                            <ul className="space-y-1.5 pl-2">
                              {q.anchor_points.map((pt, pIdx) => (
                                <li key={pIdx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                                  <span className="text-mint font-bold">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Two-Column: Challenges & Way Forward */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Challenges */}
                    {bcs?.challenges && bcs.challenges.length > 0 && (
                      <div className="p-4 rounded-tile bg-red-500/5 border border-red-500/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{t('challenges')}</span>
                        </h4>
                        <ul className="space-y-2">
                          {bcs.challenges.map((c, idx) => (
                            <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                              <span className="text-red-400 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Way Forward */}
                    {bcs?.way_forward && bcs.way_forward.length > 0 && (
                      <div className="p-4 rounded-tile bg-mint/5 border border-mint/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-mint mb-3 flex items-center space-x-2">
                          <Compass className="w-4 h-4" />
                          <span>{t('way_forward')}</span>
                        </h4>
                        <ul className="space-y-2">
                          {bcs.way_forward.map((w, idx) => (
                            <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start space-x-2">
                              <span className="text-mint font-bold">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Exam Prompt if available */}
                  {bcs?.written_exam_prompt && (
                    <div className="p-5 rounded-tile bg-gold/10 border border-gold/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gold-bright">
                          {t('exam_prompt')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gold/20 text-gold-bright text-[11px] font-bold">
                          {bcs.written_exam_prompt.marks} Marks
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-3">
                        {isBn ? bcs.written_exam_prompt.prompt_text_bn : bcs.written_exam_prompt.prompt_text_en}
                      </p>
                      {bcs.written_exam_prompt.model_outline_points.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-gold/20">
                          {bcs.written_exam_prompt.model_outline_points.map((pt, idx) => (
                            <div key={idx} className="text-xs text-text-secondary flex items-start space-x-2">
                              <span className="text-gold font-bold">{idx + 1}.</span>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verified Sources */}
                  {story.sources && story.sources.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">
                        {t('sources')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {story.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-text-secondary hover:text-mint hover:border-mint/30 transition-all"
                          >
                            <span>{src.name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
