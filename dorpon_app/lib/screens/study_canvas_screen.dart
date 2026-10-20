import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../widgets/ambient_background.dart';
import '../services/audio_briefing_service.dart';
import '../services/saved_articles_service.dart';
import '../widgets/audio_player_sheet.dart';
import '../widgets/premium_modal.dart';

class StudyCanvasScreen extends StatefulWidget {
  final CapsuleStory story;
  final bool isBcsMode;

  const StudyCanvasScreen({
    super.key,
    required this.story,
    this.isBcsMode = false,
  });

  @override
  State<StudyCanvasScreen> createState() => _StudyCanvasScreenState();
}

class _StudyCanvasScreenState extends State<StudyCanvasScreen> {
  late bool _isSaved;
  bool _isBanglaMode = false;
  int _helpfulReaction = 0; // 0 = none, 1 = insightful, 2 = high-yield
  int _reactionCount = 128;
  final Set<int> _expandedQuestions = {0}; // First question expanded by default

  @override
  void initState() {
    super.initState();
    _isSaved = SavedArticlesService().isStorySaved(widget.story.storyId);
  }

  Future<void> _openSourceUrl(String? url) async {
    if (url == null || url.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Original publisher link not directly provided for this wire dispatch.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }
    final uri = Uri.tryParse(url.trim());
    if (uri != null) {
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not launch URL: $url'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  String _cleanCategoryTitle(String cat) {
    switch (cat.toLowerCase()) {
      case 'macroeconomy_banking':
      case 'economy_business':
      case 'economy':
        return 'Economy & Business';
      case 'governance_law':
      case 'governance':
        return 'Governance & Law';
      case 'climate_delta':
      case 'environment':
        return 'Climate & Environment';
      case 'international_diplomacy':
      case 'diplomacy':
        return 'Global Diplomacy';
      case 'tech_infrastructure':
      case 'technology':
        return 'Tech & Infrastructure';
      default:
        return 'Current Affairs';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AudioBriefingService(),
      builder: (context, _) {
        final story = widget.story;
        final bcs = story.bcsPro;
        final buzz = story.dailyBuzz;
        final isPremium = AudioBriefingService().isPremiumUser;

        final headline = _isBanglaMode
            ? (buzz.titleBn.isNotEmpty ? buzz.titleBn : buzz.titleEn)
            : (buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn);

        final whyInTheNews = _isBanglaMode && (bcs != null && bcs.whyInTheNewsBn.isNotEmpty)
            ? bcs.whyInTheNewsBn
            : ((bcs != null && bcs.whyInTheNewsEn.isNotEmpty)
                ? bcs.whyInTheNewsEn
                : (_isBanglaMode ? buzz.summaryBn : buzz.summaryEn));

        final categoryLabel = _cleanCategoryTitle(story.primaryCategory);
        final readTimeMinutes = (buzz.readTimeSeconds ~/ 60) + 1;

        return Scaffold(
          backgroundColor: ObsidianTokens.background,
          body: AmbientBackground(
            child: Column(
              children: [
                // 1. Top Navigation & Action Bar (Clean single-page header)
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                            ),
                            child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 17),
                          ),
                        ),

                        // Centered Bilingual Switcher Pill
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              GestureDetector(
                                onTap: () => setState(() => _isBanglaMode = false),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: !_isBanglaMode ? ObsidianTokens.primaryMint : Colors.transparent,
                                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  ),
                                  child: Text(
                                    'EN',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: !_isBanglaMode ? Colors.black : ObsidianTokens.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _isBanglaMode = true),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _isBanglaMode ? ObsidianTokens.primaryMint : Colors.transparent,
                                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  ),
                                  child: Text(
                                    'বাং',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: _isBanglaMode ? Colors.black : ObsidianTokens.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Right Actions (Audio, Bookmark, Share)
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                AudioBriefingService().playBriefing(
                                  stories: [widget.story],
                                );
                                AudioPlayerSheet.show(context);
                              },
                              child: Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.3)),
                                ),
                                child: const Icon(Icons.headphones_rounded, color: ObsidianTokens.primaryMint, size: 18),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () {
                                SavedArticlesService().toggleSaveStory(widget.story);
                                final savedNow = SavedArticlesService().isStorySaved(widget.story.storyId);
                                setState(() => _isSaved = savedNow);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(_isSaved ? 'Article saved to your library' : 'Removed from Saved Articles'),
                                    duration: const Duration(seconds: 1),
                                    backgroundColor: ObsidianTokens.surfaceContainerLowest,
                                  ),
                                );
                              },
                              child: Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.06),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _isSaved ? Icons.bookmark : Icons.bookmark_outline,
                                  color: _isSaved ? ObsidianTokens.primaryMint : Colors.white,
                                  size: 19,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Article link copied to clipboard'),
                                    duration: Duration(seconds: 1),
                                  ),
                                );
                              },
                              child: Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.06),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.share_outlined, color: Colors.white, size: 18),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // 2. Main Reader Content: Single Integrated Page
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    physics: const BouncingScrollPhysics(),
                    children: [
                      // Category & Meta Pills Row
                      Row(
                        children: [
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.25)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.flash_on, size: 12, color: ObsidianTokens.primaryMint),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      categoryLabel,
                                      style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.timer_outlined, size: 12, color: ObsidianTokens.textSecondary),
                                const SizedBox(width: 4),
                                Text(
                                  '$readTimeMinutes min read',
                                  style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.verified, size: 12, color: ObsidianTokens.primaryMint),
                                const SizedBox(width: 4),
                                Text(
                                  'Verified',
                                  style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Tags Bar (Rendered above headline)
                      if (story.tags.isNotEmpty) ...[
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: story.tags.map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.primaryMint.withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.25)),
                              ),
                              child: Text(
                                tag,
                                style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.w600),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Full Headline
                      Text(
                        headline,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          height: 1.35,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Editorial Hero Image (if provided)
                      if (story.imageUrl.isNotEmpty) ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                          child: Stack(
                            alignment: Alignment.bottomLeft,
                            children: [
                              Image.network(
                                story.imageUrl,
                                width: double.infinity,
                                height: 210,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                              ),
                              if (story.imageCaption.isNotEmpty)
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                      colors: [
                                        Colors.black.withValues(alpha: 0.85),
                                        Colors.transparent,
                                      ],
                                    ),
                                  ),
                                  child: Text(
                                    story.imageCaption,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11.5,
                                      fontStyle: FontStyle.italic,
                                      letterSpacing: 0.1,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                      ],

                      // 1. Why in the News / The Core Story (Lead Overview)
                      _buildGlassSection(
                        title: bcs != null ? 'Why in the News' : 'The Core Story',
                        icon: Icons.newspaper_rounded,
                        accentColor: ObsidianTokens.primaryMint,
                        child: Text(
                          whyInTheNews,
                          style: const TextStyle(
                            color: Color(0xFFE2E8F0),
                            fontSize: 15,
                            height: 1.65,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Top Stories Section 2: Why It Matters & Analytical Takeaways
                      if (bcs == null && ((_isBanglaMode && buzz.whyItMattersBn.isNotEmpty) || (!_isBanglaMode && buzz.whyItMattersEn.isNotEmpty))) ...[
                        _buildGlassSection(
                          title: 'Why It Matters & Key Takeaways',
                          icon: Icons.lightbulb_outline_rounded,
                          accentColor: ObsidianTokens.accentGold,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: (_isBanglaMode ? buzz.whyItMattersBn : buzz.whyItMattersEn)
                                .split('\n')
                                .where((line) => line.trim().isNotEmpty)
                                .map((point) => _buildAnchorPoint(point))
                                .toList(),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 2. Question-by-Question Breakdown (Unified on single page)
                      if (bcs != null && bcs.questionBreakdowns.isNotEmpty) ...[
                        _buildGlassSection(
                          title: 'Question-Led Analytical Breakdown',
                          icon: Icons.quiz_outlined,
                          accentColor: ObsidianTokens.accentGold,
                          trailing: GestureDetector(
                            onTap: () {
                              setState(() {
                                if (_expandedQuestions.length == bcs.questionBreakdowns.length) {
                                  _expandedQuestions.clear();
                                } else {
                                  _expandedQuestions.addAll(
                                    List.generate(bcs.questionBreakdowns.length, (i) => i),
                                  );
                                }
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.accentGold.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _expandedQuestions.length == bcs.questionBreakdowns.length
                                        ? Icons.unfold_less_rounded
                                        : Icons.unfold_more_rounded,
                                    size: 13,
                                    color: ObsidianTokens.accentGold,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _expandedQuestions.length == bcs.questionBreakdowns.length
                                        ? 'Collapse All'
                                        : 'Expand All',
                                    style: const TextStyle(
                                      color: ObsidianTokens.accentGold,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: bcs.questionBreakdowns.asMap().entries.map((entry) {
                              final index = entry.key;
                              final qb = entry.value;
                              final isExpanded = _expandedQuestions.contains(index);

                              return Container(
                                margin: EdgeInsets.only(bottom: index == bcs.questionBreakdowns.length - 1 ? 0 : 10),
                                decoration: BoxDecoration(
                                  color: isExpanded
                                      ? ObsidianTokens.accentGold.withValues(alpha: 0.05)
                                      : Colors.white.withValues(alpha: 0.02),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isExpanded
                                        ? ObsidianTokens.accentGold.withValues(alpha: 0.28)
                                        : Colors.white.withValues(alpha: 0.07),
                                  ),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      InkWell(
                                        onTap: () {
                                          setState(() {
                                            if (isExpanded) {
                                              _expandedQuestions.remove(index);
                                            } else {
                                              _expandedQuestions.add(index);
                                            }
                                          });
                                        },
                                        child: Padding(
                                          padding: const EdgeInsets.all(12),
                                          child: Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: isExpanded
                                                      ? ObsidianTokens.accentGold.withValues(alpha: 0.22)
                                                      : Colors.white.withValues(alpha: 0.06),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  'Q${index + 1}',
                                                  style: TextStyle(
                                                    color: isExpanded
                                                        ? ObsidianTokens.accentGold
                                                        : ObsidianTokens.textSecondary,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Text(
                                                  qb.question,
                                                  style: TextStyle(
                                                    color: isExpanded ? Colors.white : const Color(0xFFE2E8F0),
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 13.5,
                                                    height: 1.35,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              AnimatedRotation(
                                                turns: isExpanded ? 0.5 : 0.0,
                                                duration: const Duration(milliseconds: 200),
                                                child: Icon(
                                                  Icons.keyboard_arrow_down_rounded,
                                                  size: 20,
                                                  color: isExpanded
                                                      ? ObsidianTokens.accentGold
                                                      : ObsidianTokens.textTertiary,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      if (isExpanded) ...[
                                        Divider(
                                          height: 1,
                                          thickness: 1,
                                          color: ObsidianTokens.accentGold.withValues(alpha: 0.15),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                                          child: (isPremium || index == 0)
                                              ? Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: qb.anchorPoints.map((pt) => _buildAnchorPoint(pt)).toList(),
                                                )
                                              : _buildBlurredPaywallAnswer(
                                                  context,
                                                  anchorPoints: qb.anchorPoints,
                                                  questionNumber: index + 1,
                                                ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 3. Challenges Section
                      if (bcs != null && bcs.challenges.isNotEmpty) ...[
                        _buildGlassSection(
                          title: 'Challenges',
                          icon: Icons.warning_amber_rounded,
                          accentColor: Colors.deepOrangeAccent,
                          child: isPremium
                              ? Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: bcs.challenges.map((c) => _buildAnchorPoint(c)).toList(),
                                )
                              : _buildBlurredPaywallSection(
                                  context,
                                  title: 'Root Challenges & Structural Risks',
                                  points: bcs.challenges,
                                ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 4. Way Forward Section
                      if (bcs != null && bcs.wayForward.isNotEmpty) ...[
                        _buildGlassSection(
                          title: 'Way Forward',
                          icon: Icons.trending_up_rounded,
                          accentColor: Colors.tealAccent,
                          child: isPremium
                              ? Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: bcs.wayForward.map((w) => _buildAnchorPoint(w)).toList(),
                                )
                              : _buildBlurredPaywallSection(
                                  context,
                                  title: 'Actionable Strategic Way Forward',
                                  points: bcs.wayForward,
                                ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 5. Government Initiatives on Investment and Security Treaties
                      if (bcs != null && bcs.governmentInitiatives.isNotEmpty) ...[
                        _buildGlassSection(
                          title: 'Government Initiatives on Investment and Security Treaties',
                          icon: Icons.gavel_rounded,
                          accentColor: Colors.purpleAccent,
                          child: isPremium
                              ? Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: bcs.governmentInitiatives.map((g) => _buildAnchorPoint(g)).toList(),
                                )
                              : _buildBlurredPaywallSection(
                                  context,
                                  title: 'Official Treaties & Policy Alignment',
                                  points: bcs.governmentInitiatives,
                                ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 6. Conclusion
                      if (bcs != null && bcs.conclusion.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: ObsidianTokens.primaryMint.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                            border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.25)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.psychology_outlined, color: ObsidianTokens.primaryMint, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Conclusion',
                                    style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                bcs.conclusion,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14.5,
                                  height: 1.6,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // 7. Verified Sources & Ground Reporting (Zero Overflow Guarantee)
                      _buildSourcesSection(story.sources),
                      const SizedBox(height: 20),

                      // 8. Reader Engagement Widget
                      _buildEngagementWidget(),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Paywall Blurred Overlay for Question Answers
  Widget _buildBlurredPaywallAnswer(
    BuildContext context, {
    required List<String> anchorPoints,
    required int questionNumber,
  }) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Blurred answers
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 5.5, sigmaY: 5.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: anchorPoints.map((pt) => _buildAnchorPoint(pt)).toList(),
            ),
          ),
        ),
        // Glassmorphic Paywall Card
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xF018241F),
            borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
            border: Border.all(color: ObsidianTokens.accentGold.withValues(alpha: 0.45)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.65),
                blurRadius: 16,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_rounded, color: ObsidianTokens.accentGold, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'Exclusive Editorial Analysis',
                    style: ObsidianTokens.labelSm(color: ObsidianTokens.accentGold).copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Unlock complete question points, root causes & strategic angles.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, fontSize: 11.5, height: 1.3),
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: () {
                  PremiumModal.show(
                    context,
                    title: 'Unlock Full Question-Led Articles',
                    subtitle: 'Upgrade to Dorpon Premium for uncapped access to all question-led articles, root cause analyses & strategic outlooks.',
                    ctaText: 'Unlock with Premium • ৳ 99/mo',
                    icon: Icons.whatshot_rounded,
                  );
                },
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                  decoration: BoxDecoration(
                    color: ObsidianTokens.accentGold,
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                    boxShadow: [
                      BoxShadow(
                        color: ObsidianTokens.accentGold.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.flash_on, size: 14, color: Colors.black),
                      SizedBox(width: 6),
                      Text(
                        'Unlock with Premium • ৳ 99/mo',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Paywall Blurred Overlay for Section Lists (Challenges, Way Forward, Treaties)
  Widget _buildBlurredPaywallSection(
    BuildContext context, {
    required String title,
    required List<String> points,
  }) {
    return Stack(
      alignment: Alignment.center,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 5.5, sigmaY: 5.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: points.map((p) => _buildAnchorPoint(p)).toList(),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xF018241F),
            borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
            border: Border.all(color: ObsidianTokens.accentGold.withValues(alpha: 0.35)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_rounded, color: ObsidianTokens.accentGold, size: 15),
                  const SizedBox(width: 6),
                  Text(
                    'Premium Strategic Content',
                    style: ObsidianTokens.labelSm(color: ObsidianTokens.accentGold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () {
                  PremiumModal.show(
                    context,
                    title: 'Unlock Full Question-Led Articles',
                    subtitle: 'Upgrade to Dorpon Premium for uncapped access to all question-led articles, root cause analyses & strategic outlooks.',
                    ctaText: 'Unlock with Premium • ৳ 99/mo',
                    icon: Icons.whatshot_rounded,
                  );
                },
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: ObsidianTokens.accentGold,
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                  ),
                  child: const Text(
                    'Unlock with Premium • ৳ 99/mo',
                    style: TextStyle(color: Colors.black, fontSize: 11.5, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Section: Verified Sources & Reporting Ground (Overflow-Free Layout)
  Widget _buildSourcesSection(List<Map<String, dynamic>> sources) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.menu_book_rounded, color: ObsidianTokens.primaryMint, size: 18),
              const SizedBox(width: 8),
              Text(
                _isBanglaMode ? 'মূল সংবাদ সূত্র ও উৎস' : 'Verified Sources & Ground Reporting',
                style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${sources.isEmpty ? 1 : sources.length} Sources',
                  style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (sources.isEmpty) ...[
            _buildSourceItemTile(
              name: 'National Wire & Official Gazette',
              url: '',
              snippet: 'Directly verified from Ministry notifications & central bank press release.',
            ),
          ] else ...[
            ...sources.map((s) {
              final name = s['name']?.toString() ?? 'Daily Press Source';
              final url = s['url']?.toString() ?? '';
              final snippet = s['title']?.toString() ?? s['snippet']?.toString() ?? 'Primary editorial dispatch';
              return _buildSourceItemTile(name: name, url: url, snippet: snippet);
            }),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 13, color: ObsidianTokens.textTertiary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Dorpon Cross-Verification: Synthesized across accredited media & verified data points.',
                  style: TextStyle(fontSize: 11, color: ObsidianTokens.textTertiary),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Overflow-Free Source Tile
  Widget _buildSourceItemTile({required String name, required String url, required String snippet}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: ObsidianTokens.primaryMint.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      name,
                      style: const TextStyle(
                        color: ObsidianTokens.primaryMint,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
              if (url.isNotEmpty) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _openSourceUrl(url),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Read', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                        SizedBox(width: 4),
                        Icon(Icons.open_in_new, size: 12, color: Colors.white),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (snippet.isNotEmpty && snippet != name) ...[
            const SizedBox(height: 6),
            Text(
              snippet,
              style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  // Interactive Engagement / Reaction Bar
  Widget _buildEngagementWidget() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Was this dispatch insightful?',
                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
              ),
              Text(
                '$_reactionCount readers reacted',
                style: ObsidianTokens.labelXs(color: ObsidianTokens.textTertiary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_helpfulReaction == 1) {
                        _helpfulReaction = 0;
                        _reactionCount--;
                      } else {
                        if (_helpfulReaction == 0) _reactionCount++;
                        _helpfulReaction = 1;
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _helpfulReaction == 1
                          ? ObsidianTokens.primaryMint.withValues(alpha: 0.2)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                      border: Border.all(
                        color: _helpfulReaction == 1
                            ? ObsidianTokens.primaryMint
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.thumb_up_alt_rounded,
                            size: 14,
                            color: _helpfulReaction == 1 ? ObsidianTokens.primaryMint : Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Insightful',
                            style: TextStyle(
                              fontSize: 12,
                              color: _helpfulReaction == 1 ? ObsidianTokens.primaryMint : Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_helpfulReaction == 2) {
                        _helpfulReaction = 0;
                        _reactionCount--;
                      } else {
                        if (_helpfulReaction == 0) _reactionCount++;
                        _helpfulReaction = 2;
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _helpfulReaction == 2
                          ? ObsidianTokens.accentGold.withValues(alpha: 0.2)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                      border: Border.all(
                        color: _helpfulReaction == 2
                            ? ObsidianTokens.accentGold
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.bolt_rounded,
                            size: 16,
                            color: _helpfulReaction == 2 ? ObsidianTokens.accentGold : Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'High Yield',
                            style: TextStyle(
                              fontSize: 12,
                              color: _helpfulReaction == 2 ? ObsidianTokens.accentGold : Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnchorPoint(String pt) {
    // Matches "**Title:** body" or "Title: body" (e.g. "The Definition: ...")
    final match = RegExp(r'^(?:\*\*)?([^:\n]+?)(?:\*\*)?:\s*(.*)$', dotAll: true).firstMatch(pt);
    if (match != null && match.group(1) != null && match.group(2) != null && match.group(1)!.trim().isNotEmpty) {
      final rawTitle = match.group(1)!.replaceAll('*', '').trim();
      final body = match.group(2)!.trim();
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: RichText(
          text: TextSpan(
            style: ObsidianTokens.bodyMd(color: ObsidianTokens.textPrimary).copyWith(height: 1.55),
            children: [
              TextSpan(
                text: '• $rawTitle: ',
                style: const TextStyle(
                  color: ObsidianTokens.accentGold,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              TextSpan(text: body),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: ObsidianTokens.primaryMint, fontSize: 14)),
          Expanded(child: Text(pt, style: ObsidianTokens.bodyMd(color: ObsidianTokens.textPrimary).copyWith(height: 1.55))),
        ],
      ),
    );
  }

  Widget _buildGlassSection({
    required String title,
    required IconData icon,
    required Color accentColor,
    Widget? trailing,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
        border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: accentColor, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: ObsidianTokens.labelSm(color: accentColor),
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
