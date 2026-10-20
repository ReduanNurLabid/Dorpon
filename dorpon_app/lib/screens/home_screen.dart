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
import '../services/audio_briefing_service.dart';
import '../services/saved_articles_service.dart';
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

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) {
      return 'Good Morning,';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon,';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening,';
    } else {
      return 'Welcome Back,';
    }
  }

  String _getFormattedDate() {
    final now = DateTime.now();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final weekday = weekdays[now.weekday - 1];
    final month = months[now.month - 1];
    return 'Daily Brief • $weekday, $month ${now.day}';
  }

  @override
  Widget build(BuildContext context) {
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
                                      'Dorpon',
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
                                                _getFormattedDate(),
                                                textAlign: TextAlign.center,
                                                style: ObsidianTokens.labelSm(color: ObsidianTokens.textSecondary),
                                              ),
                                              const SizedBox(height: 6),
                                              GestureDetector(
                                                onTap: () {
                                                  _navigateToPage(4);
                                                },
                                                child: Text(
                                                  '${_getTimeGreeting()}\nAsif',
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
                                                                ? 'Playing • ${audio.formattedPosition}'
                                                                : 'Listen • ${audio.formattedTotalDuration}',
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
                                              _buildTopNavTab(0, 'Discover'),
                                              const SizedBox(width: 22),
                                              _buildTopNavTab(1, 'Top Stories'),
                                              const SizedBox(width: 22),
                                              _buildTopNavTab(
                                                2,
                                                'Current Affairs',
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
    return RefreshIndicator(
      color: ObsidianTokens.primaryMint,
      backgroundColor: ObsidianTokens.surfaceContainerHigh,
      onRefresh: _loadAllFeeds,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(bottom: 120, top: 8),
        children: [
          // Featured Stories Carousel (Spacious Huxe Cards)
          if (_isLoading)
            const SizedBox(
              height: 280,
              child: Center(
                child: CircularProgressIndicator(color: ObsidianTokens.primaryMint),
              ),
            )
          else if (_buzzStories.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text('No stories found for today.', style: ObsidianTokens.bodyMd()),
              ),
            )
          else
            SizedBox(
              height: 315,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                scrollDirection: Axis.horizontal,
                itemCount: _buzzStories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  return _buildStoryCard(_buzzStories[index]);
                },
              ),
            ),

          const SizedBox(height: 32),

          // Daily Digest Section
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
                      'Hourly Breaking Wires',
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.textPrimary),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'LIVE WIRES',
                        style: TextStyle(
                          color: ObsidianTokens.primaryMint,
                          fontSize: 8.5,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...(_hourlyWires.isNotEmpty ? _hourlyWires : _buzzStories.skip(3)).take(4).map((story) {
                  final buzz = story.dailyBuzz;
                  final title = buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn;
                  final takeaway = buzz.whyItMattersEn.isNotEmpty ? buzz.whyItMattersEn : buzz.whyItMattersBn;

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
                          children: [
                            Expanded(
                              child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: ObsidianTokens.headlineMd(color: Colors.white),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  takeaway,
                                  style: ObsidianTokens.bodyMd(),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
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
                                    color: isSaved ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary.withOpacity(0.5),
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.arrow_forward_ios, size: 13, color: ObsidianTokens.textSecondary),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    ),
  );
}

  Widget _buildStoryCard(CapsuleStory story) {
    final buzz = story.dailyBuzz;
    final sourceName = story.sources.isNotEmpty ? story.sources[0]['name'] : 'Daily Brief';
    final title = buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn;
    final summary = buzz.summaryEn.isNotEmpty ? buzz.summaryEn : buzz.summaryBn;

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
        width: 295,
        padding: const EdgeInsets.all(18),
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
                // Category Chip & Read Time (Protected against overflow)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                        ),
                        child: Text(
                          sourceName,
                          style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${buzz.readTimeSeconds ~/ 60 + 1}m read',
                          style: ObsidianTokens.labelXs(),
                        ),
                        const SizedBox(width: 8),
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
                                size: 18,
                                color: isSaved ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15.5,
                    fontWeight: FontWeight.w600,
                    height: 1.3,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  summary,
                  style: ObsidianTokens.bodyMd(color: ObsidianTokens.textSecondary).copyWith(fontSize: 12.5, height: 1.4),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),

            // Bottom Action Link
            Row(
              children: [
                Text(
                  'Read Full Story',
                  style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward, size: 14, color: ObsidianTokens.primaryMint),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
