import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/api_service.dart';
import '../widgets/ambient_background.dart';
import '../widgets/floating_dock.dart';
import 'study_canvas_screen.dart';
import 'discover_screen.dart';
import 'current_affairs_screen.dart';
import 'saved_screen.dart';
import 'profile_screen.dart';
import 'all_news_screen.dart';
import '../services/audio_briefing_service.dart';
import '../services/saved_articles_service.dart';
import '../services/app_settings_service.dart';
import '../services/auth_service.dart';
import '../widgets/mini_audio_player.dart';
import '../widgets/audio_player_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final PageController _pageController;
  int _activeNavIndex = 1; // 0: Discover, 1: Top Stories (Center), 2: Current Affairs, 3: Saved
  bool _isLoading = true;
  List<CapsuleStory> _buzzStories = [];
  List<CapsuleStory> _affairsStories = [];
  List<CapsuleStory> _hourlyWires = [];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 1);
    _loadAllFeeds();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadAllFeeds() async {
    setState(() => _isLoading = true);
    final buzz = await ApiService.fetchDailyBuzzFeed();
    final affairs = await ApiService.fetchBcsProFeed();
    final hourly = await ApiService.fetchHourlyWiresFeed();
    AudioBriefingService().loadEditionStories(buzz);
    setState(() {
      _buzzStories = buzz;
      _affairsStories = affairs;
      _hourlyWires = hourly;
      _isLoading = false;
    });
  }

  void _navigateToPage(int index) {
    setState(() => _activeNavIndex = index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeInOutCubic,
    );
  }

  String _getTimeGreeting(AppSettingsService settings) {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return settings.tr('good_morning');
    } else if (hour >= 12 && hour < 17) {
      return settings.tr('good_afternoon');
    } else if (hour >= 17 && hour < 21) {
      return settings.tr('good_evening');
    } else {
      return settings.tr('welcome_back');
    }
  }

  String _getFormattedDate(AppSettingsService settings) {
    final now = DateTime.now();
    if (settings.isBangla) {
      const weekdaysBn = ['সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার', 'রবিবার'];
      const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      final weekday = weekdaysBn[now.weekday - 1];
      final month = monthsBn[now.month - 1];
      return 'দৈনিক ব্রিফ • $weekday, $month ${toBanglaDigits(now.day)}';
    }
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final weekday = weekdays[now.weekday - 1];
    final month = months[now.month - 1];
    return 'Daily Brief • $weekday, $month ${now.day}';
  }

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsService();
    final auth = AuthService();

    return AnimatedBuilder(
      animation: Listenable.merge([settings, auth]),
      builder: (context, _) {
        final user = auth.currentUser;
        final userName = user != null && user.displayName.trim().isNotEmpty
            ? user.displayName.trim().split(RegExp(r'\s+')).first
            : (settings.isBangla ? 'পাঠক' : 'Reader');

        return Scaffold(
          backgroundColor: ObsidianTokens.background,
          body: AmbientBackground(
            child: Stack(
              children: [
                NestedScrollView(
                  headerSliverBuilder: (context, innerBoxIsScrolled) {
                    return [
                      SliverToBoxAdapter(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // 1. Top Header Bar (Clean & Decluttered - No refresh icon)
                            AnimatedBuilder(
                              animation: _pageController,
                              builder: (context, _) {
                                double page = _activeNavIndex.toDouble();
                                if (_pageController.hasClients &&
                                    _pageController.position.hasContentDimensions &&
                                    _pageController.page != null) {
                                  page = _pageController.page!;
                                }
                                double headerOpacity = (4.0 - page).clamp(0.0, 1.0);
                                if (headerOpacity <= 0.0) return const SizedBox.shrink();

                                return Opacity(
                                  opacity: headerOpacity,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          settings.tr('app_name'),
                                          style: ObsidianTokens.headlineLg(color: Colors.white),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            _navigateToPage(0);
                                          },
                                          child: Container(
                                            width: 38,
                                            height: 38,
                                            decoration: BoxDecoration(
                                              color: Colors.white.withValues(alpha: 0.06),
                                              shape: BoxShape.circle,
                                              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                                            ),
                                            child: const Icon(Icons.search, color: Colors.white, size: 20),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),

                            // 2. Animated Collapsing Header & Tab Bar
                            AnimatedBuilder(
                              animation: _pageController,
                              builder: (context, _) {
                                double page = _activeNavIndex.toDouble();
                                if (_pageController.hasClients &&
                                    _pageController.position.hasContentDimensions &&
                                    _pageController.page != null) {
                                  page = _pageController.page!;
                                }
                                // Progress is 1.0 on Top Stories (page 1), and 0.0 on Discover (page 0) or Current Affairs (page 2)
                                double offsetFromCenter = (page - 1.0).abs().clamp(0.0, 1.0);
                                double progress = (1.0 - offsetFromCenter).clamp(0.0, 1.0);

                                // Tab bar is visible for pages 0, 1, 2
                                double tabVisibility = 1.0;
                                if (page > 2.0) {
                                  tabVisibility = (1.0 - (page - 2.0)).clamp(0.0, 1.0);
                                }

                                if (tabVisibility <= 0.0 && progress <= 0.0) {
                                  return const SizedBox.shrink();
                                }

                                return Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Collapsing Greeting + Listen Button (Smoothly animates across swipes)
                                    ClipRect(
                                      child: Align(
                                        alignment: Alignment.topCenter,
                                        heightFactor: progress,
                                        child: Opacity(
                                          opacity: progress,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                                            child: Center(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.center,
                                                children: [
                                                  Text(
                                                    _getFormattedDate(settings),
                                                    textAlign: TextAlign.center,
                                                    style: ObsidianTokens.labelSm(color: ObsidianTokens.textSecondary),
                                                  ),
                                                  const SizedBox(height: 6),
                                                  GestureDetector(
                                                    onTap: () {
                                                      _navigateToPage(4);
                                                    },
                                                    child: Text(
                                                      '${_getTimeGreeting(settings)}\n$userName',
                                                      textAlign: TextAlign.center,
                                                      style: ObsidianTokens.headlineXl(),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 16),

                                                  // Interactive Audio Briefing Action Pill
                                                  AnimatedBuilder(
                                                    animation: AudioBriefingService(),
                                                    builder: (context, _) {
                                                      final audio = AudioBriefingService();
                                                      return GestureDetector(
                                                        onTap: () {
                                                          if (!audio.isPlaying && !audio.isPlayerVisible) {
                                                            audio.playBriefing(stories: _buzzStories);
                                                          }
                                                          AudioPlayerSheet.show(context);
                                                        },
                                                        child: Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                                          decoration: BoxDecoration(
                                                            color: audio.isPlaying
                                                                ? ObsidianTokens.primaryMint.withValues(alpha: 0.16)
                                                                : Colors.white.withValues(alpha: 0.06),
                                                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                                            border: Border.all(
                                                              color: audio.isPlaying
                                                                  ? ObsidianTokens.primaryMint
                                                                  : Colors.white.withValues(alpha: 0.1),
                                                            ),
                                                            boxShadow: [
                                                              if (audio.isPlaying)
                                                                BoxShadow(
                                                                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.3),
                                                                  blurRadius: 18,
                                                                  spreadRadius: 2,
                                                                ),
                                                            ],
                                                          ),
                                                          child: Row(
                                                            mainAxisSize: MainAxisSize.min,
                                                            children: [
                                                              Icon(
                                                                audio.isPlaying ? Icons.graphic_eq_rounded : Icons.play_arrow_rounded,
                                                                color: ObsidianTokens.primaryMint,
                                                                size: 18,
                                                              ),
                                                              const SizedBox(width: 8),
                                                              Text(
                                                                audio.isPlaying
                                                                    ? '${settings.tr("playing")} • ${audio.formattedPosition}'
                                                                    : '${settings.tr("listen")} • ${audio.formattedTotalDuration}',
                                                                style: TextStyle(
                                                                  fontSize: 12,
                                                                  fontWeight: FontWeight.w600,
                                                                  color: audio.isPlaying ? ObsidianTokens.primaryMint : Colors.white,
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                  const SizedBox(height: 12),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),

                                    // Navigation Tab Bar
                                    ClipRect(
                                      child: Align(
                                        alignment: Alignment.topCenter,
                                        heightFactor: tabVisibility,
                                        child: Opacity(
                                          opacity: tabVisibility,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                            child: Center(
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  _buildTopNavTab(0, settings.tr('discover')),
                                                  const SizedBox(width: 22),
                                                  _buildTopNavTab(1, settings.tr('top_stories')),
                                                  const SizedBox(width: 22),
                                                  _buildTopNavTab(
                                                    2,
                                                    settings.tr('current_affairs'),
                                                    icon: Icons.auto_awesome_rounded,
                                                    iconColor: ObsidianTokens.accentGold,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ];
                  },
              body: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _activeNavIndex = index);
                },
                children: [
                  // Page 0 (Left): Discover
                  DiscoverScreen(
                    hideTopBar: true,
                    onBackToHome: () => _navigateToPage(1),
                  ),

                  // Page 1 (Center): Top Stories
                  _buildHomeFeed(),

                  // Page 2 (Right): Current Affairs
                  CurrentAffairsScreen(
                    stories: _affairsStories,
                    isLoading: _isLoading,
                    onRefresh: _loadAllFeeds,
                    hideTopBar: true,
                    onBackToHome: () => _navigateToPage(1),
                  ),

                  // Page 3 (Far Right / Bookmark): Saved Revision Binder
                  SavedScreen(
                    hideTopBar: true,
                    onBackToHome: () => _navigateToPage(1),
                  ),

                  // Page 4 (Rightmost tab): Profile & Preferences
                  ProfileScreen(
                    onBackToHome: () => _navigateToPage(1),
                  ),
                ],
              ),
            ),

            // 4. Persistent Floating Mini Audio Player Bar (Above Dock)
            const Positioned(
              left: 0,
              right: 0,
              bottom: 90,
              child: MiniAudioPlayer(),
            ),

            // 5. Floating Capsule Bottom Navigation Dock (Stitch Design)
            Positioned(
              left: 0,
              right: 0,
              bottom: 24,
              child: Center(
                child: FloatingDock(
                  activeIndex: _activeNavIndex,
                  onTabSelected: _navigateToPage,
                ),
              ),
            ),
          ],
        ),
      ),
    );
      },
    );
  }

  Widget _buildTopNavTab(int index, String title, {IconData? icon, Color? iconColor}) {
    final isActive = _activeNavIndex == index;
    return GestureDetector(
      onTap: () => _navigateToPage(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  color: iconColor ?? (isActive ? Colors.white : ObsidianTokens.textSecondary),
                  size: 15,
                ),
                const SizedBox(width: 5),
              ],
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive ? Colors.white : ObsidianTokens.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          if (isActive)
            Container(
              height: 2,
              width: 22,
              decoration: BoxDecoration(
                color: index == 2 ? ObsidianTokens.accentGold : ObsidianTokens.primaryMint,
                borderRadius: BorderRadius.circular(2),
              ),
            )
          else
            const SizedBox(height: 2),
        ],
      ),
    );
  }

  Widget _buildHomeFeed() {
    final settings = AppSettingsService();
    final topStories = _buzzStories.take(6).toList();
    final topStoryIds = topStories.map((s) => s.storyId).toSet();
    final availableWirePool = _hourlyWires.isNotEmpty ? _hourlyWires : _buzzStories;
    final wireStories = availableWirePool.where((s) => !topStoryIds.contains(s.storyId)).take(8).toList();

    return RefreshIndicator(
      color: ObsidianTokens.primaryMint,
      backgroundColor: ObsidianTokens.surfaceContainerHigh,
      onRefresh: _loadAllFeeds,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(bottom: 120, top: 4),
        children: [
          // 1. Featured Top Stories Carousel Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: ObsidianTokens.accentGold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      settings.isBangla ? 'আজকের প্রধান খবর' : 'Top Stories Today',
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.textPrimary),
                    ),
                  ],
                ),
                Text(
                  settings.isBangla
                      ? 'আরও দেখতে সোয়াইপ করুন • ${toBanglaDigits(topStories.length)}টি সংবাদ'
                      : 'Swipe for more • ${topStories.length} curated',
                  style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // Horizontal Featured Carousel (Clean cards with smooth horizontal scroll)
          if (_isLoading)
            const SizedBox(
              height: 290,
              child: Center(
                child: CircularProgressIndicator(color: ObsidianTokens.primaryMint),
              ),
            )
          else if (topStories.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text(
                  settings.isBangla ? 'আজকের কোনো সংবাদ পাওয়া যায়নি।' : 'No stories found for today.',
                  style: ObsidianTokens.bodyMd(),
                ),
              ),
            )
          else
            SizedBox(
              height: 290,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: topStories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  return _buildStoryCard(topStories[index]);
                },
              ),
            ),

          const SizedBox(height: 32),

          // 2. Vertical Hourly Breaking Wires Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: ObsidianTokens.primaryMint,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      settings.tr('breaking_wires'),
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.textPrimary),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'LIVE',
                        style: TextStyle(
                          color: ObsidianTokens.primaryMint,
                          fontSize: 8.5,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AllNewsScreen(
                              initialStories: _hourlyWires.isNotEmpty ? _hourlyWires : _buzzStories,
                            ),
                          ),
                        );
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            settings.tr('view_all'),
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.chevron_right, size: 14, color: ObsidianTokens.primaryMint),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Vertical list of live wire items
                ...wireStories.map((story) {
                  final buzz = story.dailyBuzz;
                  final isBangla = settings.isBangla;
                  final String sourceLabel;
                  if (story.sources.length > 1) {
                    final names = story.sources
                        .map((s) => s['name']?.toString() ?? '')
                        .where((n) => n.isNotEmpty)
                        .take(2)
                        .join(' • ');
                    sourceLabel = isBangla
                        ? '${toBanglaDigits(story.sources.length)}টি সূত্র: $names'
                        : '${story.sources.length} Sources: $names';
                  } else {
                    sourceLabel = story.sources.isNotEmpty ? (story.sources[0]['name'] ?? 'News Wire') : 'News Wire';
                  }

                  final title = settings.localize(en: buzz.titleEn, bn: buzz.titleBn);
                  final lead = isBangla
                      ? (buzz.leadBn.isNotEmpty ? buzz.leadBn : buzz.summaryBn)
                      : (buzz.leadEn.isNotEmpty ? buzz.leadEn : buzz.summaryEn);
                  final publishedTime = story.formattedPublishedTimeLocalized(isBangla);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudyCanvasScreen(story: story),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Source Newspaper & Publication Timestamp
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          sourceLabel,
                                          style: const TextStyle(
                                            color: ObsidianTokens.primaryMint,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (publishedTime.isNotEmpty) ...[
                                        const SizedBox(width: 6),
                                        Text(
                                          '•',
                                          style: TextStyle(
                                            color: ObsidianTokens.textSecondary.withValues(alpha: 0.5),
                                            fontSize: 10,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        const Icon(Icons.schedule, size: 11, color: ObsidianTokens.textSecondary),
                                        const SizedBox(width: 3),
                                        Text(
                                          publishedTime,
                                          style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    title,
                                    style: ObsidianTokens.headlineMd(color: Colors.white),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (lead.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      lead,
                                      style: ObsidianTokens.bodyMd().copyWith(fontSize: 12.5),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              children: [
                                AnimatedBuilder(
                                  animation: SavedArticlesService(),
                                  builder: (context, _) {
                                    final isSaved = SavedArticlesService().isStorySaved(story.storyId);
                                    return GestureDetector(
                                      onTap: () {
                                        SavedArticlesService().toggleSaveStory(story);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(isSaved ? 'Removed from saved' : 'Story saved to reading list'),
                                            duration: const Duration(seconds: 2),
                                          ),
                                        );
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.all(4.0),
                                        child: Icon(
                                          isSaved ? Icons.bookmark : Icons.bookmark_border,
                                          size: 19,
                                          color: isSaved
                                              ? ObsidianTokens.primaryMint
                                              : ObsidianTokens.textSecondary.withValues(alpha: 0.5),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                const SizedBox(height: 12),
                                Icon(Icons.arrow_forward_ios, size: 13, color: ObsidianTokens.textSecondary),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),

                const SizedBox(height: 8),

                // 3. Prominent 'Explore All News & Past Archive' Action Button
                Center(
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => AllNewsScreen(
                            initialStories: _hourlyWires.isNotEmpty ? _hourlyWires : _buzzStories,
                          ),
                        ),
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                        border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.history_rounded, size: 18, color: ObsidianTokens.primaryMint),
                          const SizedBox(width: 8),
                          Text(
                            settings.tr('explore_all'),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: ObsidianTokens.primaryMint,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, size: 15, color: ObsidianTokens.primaryMint),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoryCard(CapsuleStory story) {
    final settings = AppSettingsService();
    final buzz = story.dailyBuzz;
    final isBangla = settings.isBangla;

    // Multi-source verification display: "৩টি সূত্র" with outlet names
    final String sourceLabel;
    if (story.sources.length > 1) {
      final names = story.sources
          .map((s) => s['name']?.toString() ?? '')
          .where((n) => n.isNotEmpty)
          .take(2)
          .join(' • ');
      sourceLabel = isBangla
          ? '${toBanglaDigits(story.sources.length)}টি সূত্র: $names'
          : '${story.sources.length} Sources: $names';
    } else {
      sourceLabel = story.sources.isNotEmpty ? (story.sources[0]['name'] ?? 'Daily Brief') : 'Daily Brief';
    }

    final title = settings.localize(en: buzz.titleEn, bn: buzz.titleBn);
    final lead = isBangla
        ? (buzz.leadBn.isNotEmpty ? buzz.leadBn : buzz.summaryBn)
        : (buzz.leadEn.isNotEmpty ? buzz.leadEn : buzz.summaryEn);
    final bullets = isBangla ? buzz.bulletsBn : buzz.bulletsEn;
    final publishedTime = story.formattedPublishedTimeLocalized(isBangla);

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
        width: 320,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Meta Row: Multi-Source Pill + Published Time + Bookmark
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                          border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified, size: 11, color: ObsidianTokens.primaryMint),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                sourceLabel,
                                style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (publishedTime.isNotEmpty) ...[
                          const Icon(Icons.schedule, size: 11, color: ObsidianTokens.textSecondary),
                          const SizedBox(width: 3),
                          Text(
                            publishedTime,
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                          ),
                          const SizedBox(width: 6),
                        ],
                        AnimatedBuilder(
                          animation: SavedArticlesService(),
                          builder: (context, _) {
                            final isSaved = SavedArticlesService().isStorySaved(story.storyId);
                            return GestureDetector(
                              onTap: () {
                                SavedArticlesService().toggleSaveStory(story);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(isSaved ? 'Removed from saved' : 'Story saved to reading list'),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: Icon(
                                isSaved ? Icons.bookmark : Icons.bookmark_border,
                                size: 17,
                                color: isSaved ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Headline
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                // 1-line lead
                if (lead.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    lead,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      height: 1.35,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                // 3 bullets
                if (bullets.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  ...bullets.take(3).toList().asMap().entries.map((entry) {
                    final idx = entry.key + 1;
                    final bullet = entry.value;
                    final idxStr = isBangla ? toBanglaDigits(idx) : '$idx';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 3),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$idxStr. ',
                            style: const TextStyle(
                              color: ObsidianTokens.primaryMint,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Expanded(
                            child: Text(
                              bullet,
                              style: const TextStyle(
                                color: Color(0xFFE2E8F0),
                                fontSize: 11.5,
                                height: 1.3,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),

            // Bottom Action Row: Read Full Story (in Bangla: পুরো সংবাদ পড়ুন) + 10s gist (১০ সেকেন্ড পাঠ)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      isBangla ? 'পুরো সংবাদ পড়ুন' : 'Read Full Story',
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontSize: 11),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward, size: 13, color: ObsidianTokens.primaryMint),
                  ],
                ),
                Text(
                  isBangla ? '১০ সেকেন্ড পাঠ' : '10s gist',
                  style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
