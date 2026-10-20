import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/app_settings_service.dart';
import 'study_canvas_screen.dart';

class CurrentAffairsScreen extends StatefulWidget {
  final List<CapsuleStory> stories;
  final bool isLoading;
  final VoidCallback onRefresh;
  final VoidCallback? onBackToHome;
  final bool hideTopBar;

  const CurrentAffairsScreen({
    super.key,
    required this.stories,
    required this.isLoading,
    required this.onRefresh,
    this.onBackToHome,
    this.hideTopBar = false,
  });

  @override
  State<CurrentAffairsScreen> createState() => _CurrentAffairsScreenState();
}

class _CurrentAffairsScreenState extends State<CurrentAffairsScreen> {
  String _selectedTag = 'All';

  List<String> _getAllTags() {
    final set = <String>{'All'};
    for (final s in widget.stories) {
      set.addAll(s.tags);
    }
    if (set.length <= 1) {
      set.addAll(['#Geopolitics', '#RedSeaCrisis', '#MigrantLabor', '#EnergySecurity', '#TradeCorridors']);
    }
    return set.toList();
  }

  List<CapsuleStory> _getFilteredStories() {
    if (_selectedTag == 'All') return widget.stories;
    return widget.stories.where((s) {
      return s.tags.any((t) => t.toLowerCase() == _selectedTag.toLowerCase()) ||
          (s.dailyBuzz.titleEn + s.dailyBuzz.titleBn).toLowerCase().contains(_selectedTag.replaceAll('#', '').toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsService();
    final filteredStories = _getFilteredStories();

    return RefreshIndicator(
      color: ObsidianTokens.primaryMint,
      backgroundColor: ObsidianTokens.surfaceContainerHigh,
      onRefresh: () async => widget.onRefresh(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          // 1. Optional Top App Bar (if not embedded)
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
                        child: const Icon(Icons.arrow_back_ios_new, color: ObsidianTokens.primaryMint, size: 18),
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
                      child: const Icon(Icons.public, color: ObsidianTokens.accentGold, size: 20),
                    ),
                  Text(
                    'Dorpon',
                    style: ObsidianTokens.headlineLg(color: Colors.white),
                  ),
                  GestureDetector(
                    onTap: widget.onRefresh,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.06),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: const Icon(Icons.refresh, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),

          // 2. Centered Screen Header (Sophisticated Issue Tracker)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Center(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.auto_awesome_rounded, color: ObsidianTokens.accentGold, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        settings.isBangla ? 'চলতি ঘটনাবলী ও বিশ্লেষণ' : 'Current Affairs & Analyses',
                        style: ObsidianTokens.headlineLg(color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    settings.isBangla
                        ? 'গভীর বিশ্লেষণ, সংবাদের মূল কারণ ও কৌশলগত দৃষ্টিভঙ্গি'
                        : 'Question-led analyses, root causes & strategic perspectives',
                    textAlign: TextAlign.center,
                    style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // 3. Dynamic Tags Filter Chips
          SizedBox(
            height: 38,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: _getAllTags().length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final tag = _getAllTags()[index];
                final isSelected = _selectedTag.toLowerCase() == tag.toLowerCase();
                return GestureDetector(
                  onTap: () => setState(() => _selectedTag = tag),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? ObsidianTokens.accentGold.withValues(alpha: 0.18)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                      border: Border.all(
                        color: isSelected
                            ? ObsidianTokens.accentGold.withValues(alpha: 0.5)
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (tag == 'All') ...[
                          Icon(Icons.dashboard_outlined, size: 13, color: isSelected ? ObsidianTokens.accentGold : ObsidianTokens.textSecondary),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          tag,
                          style: ObsidianTokens.labelSm(
                            color: isSelected ? ObsidianTokens.accentGold : ObsidianTokens.textSecondary,
                          ).copyWith(fontWeight: isSelected ? FontWeight.bold : FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          // 4. Issue Trackers List
          if (widget.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 60),
              child: Center(
                child: CircularProgressIndicator(color: ObsidianTokens.primaryMint),
              ),
            )
          else if (filteredStories.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.inbox_outlined, size: 48, color: ObsidianTokens.textSecondary.withValues(alpha: 0.5)),
                    const SizedBox(height: 12),
                    Text(
                      'No issue trackers found in this category.',
                      style: ObsidianTokens.bodyMd(color: ObsidianTokens.textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  for (int i = 0; i < filteredStories.length; i++)
                    _buildIssueCard(context, filteredStories[i], i),
                ],
              ),
            ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildIssueCard(BuildContext context, CapsuleStory story, int index) {
    final settings = AppSettingsService();
    final bcs = story.bcsPro;
    final buzz = story.dailyBuzz;

    // Use clean category & topic titles instead of syllabus or paper names
    String rawTopic = bcs?.syllabusMapping?.microtheme ??
        (bcs?.bcsSubjectArea.isNotEmpty == true ? bcs!.bcsSubjectArea : 'Global & National Affairs');

    // Clean up "Bangladesh Affairs ›", "International Affairs ›", "Paper V", etc.
    String cleanTopic = rawTopic
        .replaceAll(RegExp(r'Paper\s+[IVXLCDM]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'^(Bangladesh|International|National)\s+(Affairs|Economy)\s*[›>:-]\s*', caseSensitive: false), '')
        .trim();
    if (cleanTopic.startsWith('›') || cleanTopic.startsWith('>')) {
      cleanTopic = cleanTopic.substring(1).trim();
    }
    if (cleanTopic.isEmpty) {
      cleanTopic = settings.isBangla ? 'কৌশলগত বিশ্লেষণ' : 'Strategic Analysis';
    }

    final title = settings.localize(en: buzz.titleEn, bn: buzz.titleBn);
    final overviewText = settings.localize(
      en: (bcs != null && bcs.whyInTheNewsEn.isNotEmpty) ? bcs.whyInTheNewsEn : buzz.summaryEn,
      bn: (bcs != null && bcs.whyInTheNewsBn.isNotEmpty) ? bcs.whyInTheNewsBn : buzz.summaryBn,
    );
    final readTimeText = settings.isBangla
        ? '${buzz.readTimeSeconds ~/ 60 + 1} মিনিট পাঠ'
        : '${buzz.readTimeSeconds ~/ 60 + 1}m read';
    final publishedTime = story.formattedPublishedTime;

    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => StudyCanvasScreen(story: story),
                ),
              );
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (story.imageUrl.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(ObsidianTokens.radiusCard)),
                    child: Image.network(
                      story.imageUrl,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                ],

                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. Meta Row: Clean Topic • Published Time • Read Time
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              cleanTopic,
                              style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$publishedTime • $readTimeText',
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                          ),
                        ],
                      ),

                      // 2. Focused Tags (Max 2-3 tags for clean minimalism)
                      if (story.tags.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: story.tags.take(3).map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                              ),
                              child: Text(
                                tag,
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                      const SizedBox(height: 14),

                      // 3. Clear Headline with Proper Breathing Room
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17.5,
                          fontWeight: FontWeight.w700,
                          height: 1.38,
                          letterSpacing: -0.2,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),

                      const SizedBox(height: 10),

                      // 4. Clean Narrative Overview
                      Text(
                        overviewText,
                        style: const TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 13.5,
                          height: 1.55,
                          letterSpacing: 0.1,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

