import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/saved_articles_service.dart';
import '../services/audio_briefing_service.dart';
import '../services/app_settings_service.dart';
import '../widgets/audio_player_sheet.dart';
import 'study_canvas_screen.dart';

class SavedScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;
  final bool hideTopBar;

  const SavedScreen({
    super.key,
    this.onBackToHome,
    this.hideTopBar = false,
  });

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  final SavedArticlesService _savedService = SavedArticlesService();

  void _confirmClearAll() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ObsidianTokens.surfaceContainerHigh,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusLg),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        title: Text(
          'Clear All Saved Articles?',
          style: ObsidianTokens.headlineMd(color: Colors.white),
        ),
        content: Text(
          'This will remove all saved articles from your library. You can always bookmark them again while reading.',
          style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: TextStyle(color: ObsidianTokens.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent.withValues(alpha: 0.2),
              foregroundColor: Colors.redAccent.shade100,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                side: BorderSide(color: Colors.redAccent.withValues(alpha: 0.6), width: 1),
              ),
            ),
            onPressed: () {
              _savedService.clearAll();
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All saved articles cleared'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _savedService,
      builder: (context, _) {
        final savedStories = _savedService.savedStories;

        return RefreshIndicator(
          color: ObsidianTokens.primaryMint,
          backgroundColor: ObsidianTokens.surfaceContainerHigh,
          onRefresh: () async {
            await Future.delayed(const Duration(milliseconds: 300));
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.only(bottom: 120),
            children: [
              // 1. Top App Bar (only if not embedded in HomeScreen)
              if (!widget.hideTopBar)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (widget.onBackToHome != null)
                        GestureDetector(
                          onTap: widget.onBackToHome,
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new,
                              color: ObsidianTokens.primaryMint,
                              size: 18,
                            ),
                          ),
                        )
                      else
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.06),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.bookmark_outline,
                            color: ObsidianTokens.primaryMint,
                            size: 20,
                          ),
                        ),
                      Text(
                        'Dorpon',
                        style: ObsidianTokens.headlineLg(color: Colors.white),
                      ),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),

              // 2. Clean Screen Title & Action Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Saved Articles',
                              style: ObsidianTokens.headlineLg(color: Colors.white),
                            ),
                            if (savedStories.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 2),
                                decoration: BoxDecoration(
                                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  border: Border.all(
                                    color: ObsidianTokens.primaryMint.withValues(alpha: 0.35),
                                  ),
                                ),
                                child: Text(
                                  '${savedStories.length}',
                                  style: const TextStyle(
                                    color: ObsidianTokens.primaryMint,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your personal reading list & bookmarked analyses',
                          style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                        ),
                      ],
                    ),
                    if (savedStories.isNotEmpty)
                      GestureDetector(
                        onTap: _confirmClearAll,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.delete_sweep_outlined, size: 15, color: Colors.white70),
                              const SizedBox(width: 6),
                              Text(
                                'Clear All',
                                style: ObsidianTokens.labelXs(color: Colors.white).copyWith(
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // 3. Saved Articles List or Elegant Empty State
              if (savedStories.isEmpty)
                _buildEmptyState(context)
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: savedStories.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final story = savedStories[index];
                      return _buildSavedStoryCard(context, story);
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Soft glowing bookmark emblem
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: ObsidianTokens.primaryMint.withValues(alpha: 0.08),
                shape: BoxShape.circle,
                border: Border.all(
                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.2),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: ObsidianTokens.primaryMint.withValues(alpha: 0.15),
                    blurRadius: 30,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Icon(
                Icons.bookmark_border_rounded,
                size: 40,
                color: ObsidianTokens.primaryMint,
              ),
            ),
            const SizedBox(height: 24),

            // Friendly Message
            Text(
              'Your Library is Empty',
              style: ObsidianTokens.headlineMd(color: Colors.white),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'Whenever you discover an insightful story or analysis you want to revisit later, tap the bookmark icon to save it here.',
              style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary).copyWith(
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),

            // Elevated Call to Action Pill Button
            if (widget.onBackToHome != null)
              GestureDetector(
                onTap: widget.onBackToHome,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        ObsidianTokens.primaryMint,
                        Color(0xFF38B291),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                    boxShadow: [
                      BoxShadow(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.28),
                        blurRadius: 22,
                        spreadRadius: 2,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.explore_rounded, color: Colors.black, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Explore Today\'s Stories',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedStoryCard(BuildContext context, CapsuleStory story) {
    final settings = AppSettingsService();
    final buzz = story.dailyBuzz;
    final sourceName = story.sources.isNotEmpty ? story.sources[0]['name'] : 'Daily Brief';
    final title = settings.localize(en: buzz.titleEn, bn: buzz.titleBn);
    final takeaway = settings.localize(
      en: buzz.whyItMattersEn.isNotEmpty ? buzz.whyItMattersEn : buzz.summaryEn,
      bn: buzz.whyItMattersBn.isNotEmpty ? buzz.whyItMattersBn : buzz.summaryBn,
    );
    final readTime = settings.isBangla ? '১০ সেকেন্ড পাঠ' : '10s gist';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => StudyCanvasScreen(story: story),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Source / Category Tag & Remove Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                        border: Border.all(
                          color: ObsidianTokens.primaryMint.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Text(
                        sourceName,
                        style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      readTime,
                      style: ObsidianTokens.labelXs(),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    _savedService.removeStory(story.storyId);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: ObsidianTokens.surfaceContainerHigh,
                        content: const Text('Removed from saved library', style: TextStyle(color: Colors.white)),
                        duration: const Duration(seconds: 3),
                        action: SnackBarAction(
                          label: 'Undo',
                          textColor: ObsidianTokens.primaryMint,
                          onPressed: () {
                            _savedService.toggleSaveStory(story);
                          },
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.22)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.bookmark_remove_rounded, size: 13, color: Colors.redAccent.shade100),
                        const SizedBox(width: 4),
                        Text(
                          'Remove',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.redAccent.shade100,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Story Title
            Text(
              title,
              style: ObsidianTokens.headlineMd(color: Colors.white).copyWith(fontSize: 16),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            if (takeaway.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                takeaway,
                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary).copyWith(
                  height: 1.45,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],

            const SizedBox(height: 16),

            // Action Buttons Footer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                    border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        settings.isBangla ? 'পুরো সংবাদ পড়ুন' : 'Read Full Story',
                        style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 14,
                        color: ObsidianTokens.primaryMint,
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    AudioBriefingService().playBriefing(stories: [story]);
                    AudioPlayerSheet.show(context);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.headphones_rounded, size: 14, color: ObsidianTokens.textSecondary),
                        const SizedBox(width: 5),
                        Text(
                          'Listen',
                          style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
