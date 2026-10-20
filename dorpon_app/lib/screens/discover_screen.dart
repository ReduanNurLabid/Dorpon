import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/api_service.dart';
import '../services/app_settings_service.dart';
import 'study_canvas_screen.dart';

class DiscoverScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;
  final bool hideTopBar;

  const DiscoverScreen({super.key, this.onBackToHome, this.hideTopBar = false});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<CapsuleStory> _cachedStories = [];
  List<CapsuleStory> _affairsStories = [];
  int _selectedFilterIndex = 0;

  final List<String> _filters = [
    'All Channels',
    'Macroeconomy',
    'Governance & Law',
    'Delta & Climate',
    'Tech & Digital',
    'Sports & Cricket',
    'Culture & Arts',
    'Followed',
  ];

  final Set<String> _followedChannels = {
    'Macroeconomy & Banking',
    'Governance, Law & Constitution',
    'Climate, Delta & Energy',
  };

  late final List<_ChannelData> _channels;

  @override
  void initState() {
    super.initState();
    _channels = [
      _ChannelData(
        title: 'Macroeconomy & Banking',
        icon: Icons.trending_up,
        categoryKey: 'macroeconomy_banking',
        cards: [
          _DiscoverCardData(
            title: 'Central Bank & Inflation',
            subtitle: 'Daily updates • 3m avg read',
            badgeLabel: 'Live Feed',
            badgeColor: ObsidianTokens.primaryMint,
            isPulsing: true,
            gradientColors: [const Color(0xFF0F261E), const Color(0xFF08120F)],
            imageAsset: 'assets/images/discover/central_bank_inflation.png',
            channelTitle: 'Macroeconomy & Banking',
            filterKeywords: ['inflation', 'central bank', 'bangladesh bank', 'interest', 'monetary', 'economy'],
          ),
          _DiscoverCardData(
            title: 'Trade, Forex & NBR Revenue',
            subtitle: 'Fiscal telemetry • Export data',
            badgeLabel: 'Curated',
            badgeColor: ObsidianTokens.accentGold,
            isPulsing: false,
            gradientColors: [const Color(0xFF261D0F), const Color(0xFF140F08)],
            imageAsset: 'assets/images/discover/trade_forex_revenue.png',
            channelTitle: 'Macroeconomy & Banking',
            filterKeywords: ['forex', 'reserves', 'nbr', 'trade', 'export', 'import', 'remittance', 'revenue'],
          ),
        ],
      ),
      _ChannelData(
        title: 'Governance, Law & Constitution',
        icon: Icons.balance,
        categoryKey: 'governance_law',
        cards: [
          _DiscoverCardData(
            title: 'Judicial Rulings & Writs',
            subtitle: 'Article 102 review • Constitutional Law',
            badgeLabel: 'High Impact',
            badgeColor: ObsidianTokens.primaryMint,
            isPulsing: false,
            gradientColors: [const Color(0xFF13202E), const Color(0xFF0A1017)],
            imageAsset: 'assets/images/discover/judicial_rulings_writs.png',
            channelTitle: 'Governance, Law & Constitution',
            filterKeywords: ['judicial', 'high court', 'supreme court', 'writ', 'article 102', 'ruling', 'law'],
          ),
          _DiscoverCardData(
            title: 'Public Service & Policy Reforms',
            subtitle: 'Policy frameworks • 4m read',
            badgeLabel: 'Analysis',
            badgeColor: ObsidianTokens.textSecondary,
            isPulsing: false,
            gradientColors: [const Color(0xFF1D1B26), const Color(0xFF0E0D13)],
            imageAsset: 'assets/images/discover/bpsc_civil_service.png',
            channelTitle: 'Governance, Law & Constitution',
            filterKeywords: ['public service', 'civil service', 'reform', 'administration', 'governance', 'policy'],
          ),
        ],
      ),
      _ChannelData(
        title: 'Climate, Delta & Energy',
        icon: Icons.energy_savings_leaf_outlined,
        categoryKey: 'climate_delta',
        cards: [
          _DiscoverCardData(
            title: 'Delta Plan 2100 & Water Systems',
            subtitle: 'Environmental policy • 5m read',
            badgeLabel: 'Delta Plan',
            badgeColor: ObsidianTokens.primaryMint,
            isPulsing: false,
            gradientColors: [const Color(0xFF0B2421), const Color(0xFF061412)],
            imageAsset: 'assets/images/discover/delta_plan_water.png',
            channelTitle: 'Climate, Delta & Energy',
            filterKeywords: ['delta', 'climate', 'water', 'river', 'flood', 'erosion', 'environment', 'adaptation'],
          ),
          _DiscoverCardData(
            title: 'Renewable Transition & Grid',
            subtitle: 'Energy transition • 4m read',
            badgeLabel: 'Grid Pulse',
            badgeColor: ObsidianTokens.accentGold,
            isPulsing: false,
            gradientColors: [const Color(0xFF1C2213), const Color(0xFF0F120A)],
            imageAsset: 'assets/images/discover/renewable_energy_grid.png',
            channelTitle: 'Climate, Delta & Energy',
            filterKeywords: ['renewable', 'solar', 'grid', 'power', 'energy', 'electricity', 'coal'],
          ),
        ],
      ),
      _ChannelData(
        title: 'Tech & Digital Infrastructure',
        icon: Icons.memory,
        categoryKey: 'tech_infrastructure',
        cards: [
          _DiscoverCardData(
            title: 'Fintech & Digital Public Rail',
            subtitle: 'Digital currency & payment rail updates',
            badgeLabel: 'Infrastructure',
            badgeColor: ObsidianTokens.primaryMint,
            isPulsing: false,
            gradientColors: [const Color(0xFF1A1B2E), const Color(0xFF0C0D17)],
            imageAsset: 'assets/images/discover/fintech_digital_rail.png',
            channelTitle: 'Tech & Digital Infrastructure',
            filterKeywords: ['fintech', 'mfs', 'digital', 'taka', 'qr', 'payment', 'telecom', 'banking'],
          ),
          _DiscoverCardData(
            title: 'AI Governance & High-Tech Parks',
            subtitle: 'Policy roadmap • 3m read',
            badgeLabel: 'Emerging',
            badgeColor: ObsidianTokens.accentGold,
            isPulsing: false,
            gradientColors: [const Color(0xFF231626), const Color(0xFF110A13)],
            imageAsset: 'assets/images/discover/ai_tech_parks.png',
            channelTitle: 'Tech & Digital Infrastructure',
            filterKeywords: ['ai', 'tech park', 'hi-tech', 'semiconductor', 'startup', 'innovation', 'artificial intelligence'],
          ),
        ],
      ),
      _ChannelData(
        title: 'Sports & Cricket Arena',
        icon: Icons.sports_cricket,
        categoryKey: 'sports',
        cards: [
          _DiscoverCardData(
            title: 'Tigers & International Cricket',
            subtitle: 'Series updates, BCB & ICC rankings',
            badgeLabel: 'Live Pulse',
            badgeColor: ObsidianTokens.primaryMint,
            isPulsing: false,
            gradientColors: [const Color(0xFF1B2E1A), const Color(0xFF0C170D)],
            imageAsset: '',
            channelTitle: 'Sports & Cricket Arena',
            filterKeywords: ['cricket', 'bcb', 'tamim', 'shakib', 'shanto', 'ipl', 'bpl', 'world cup', 'wicket', 'match', 'tigers', 'sports'],
          ),
          _DiscoverCardData(
            title: 'Global Football & Athletics',
            subtitle: 'Champions League, FIFA & Olympic dispatches',
            badgeLabel: 'Sports',
            badgeColor: ObsidianTokens.accentGold,
            isPulsing: false,
            gradientColors: [const Color(0xFF1A262E), const Color(0xFF0C1317)],
            imageAsset: '',
            channelTitle: 'Sports & Cricket Arena',
            filterKeywords: ['football', 'fifa', 'messi', 'ronaldo', 'uefa', 'goal', 'athletics', 'league'],
          ),
        ],
      ),
      _ChannelData(
        title: 'Pop Culture & Entertainment',
        icon: Icons.movie_filter_outlined,
        categoryKey: 'entertainment',
        cards: [
          _DiscoverCardData(
            title: 'Cinema, OTT & National Arts',
            subtitle: 'Dhallywood, global releases & media culture',
            badgeLabel: 'Culture',
            badgeColor: ObsidianTokens.accentGold,
            isPulsing: false,
            gradientColors: [const Color(0xFF2E1A2B), const Color(0xFF170C15)],
            imageAsset: '',
            channelTitle: 'Pop Culture & Entertainment',
            filterKeywords: ['movie', 'cinema', 'ott', 'drama', 'music', 'theatre', 'festival', 'culture', 'entertainment'],
          ),
        ],
      ),
    ];

    _loadStories();
  }

  Future<void> _loadStories() async {
    final buzz = await ApiService.fetchDailyBuzzFeed();
    final affairs = await ApiService.fetchBcsProFeed();
    if (mounted) {
      setState(() {
        _cachedStories = buzz;
        _affairsStories = affairs;
      });
    }
  }

  List<CapsuleStory> get _allStories {
    final seen = <String>{};
    final combined = <CapsuleStory>[];
    for (final s in [..._cachedStories, ..._affairsStories]) {
      if (seen.add(s.storyId)) {
        combined.add(s);
      }
    }
    return combined;
  }

  void _toggleFollow(String channel) {
    setState(() {
      if (_followedChannels.contains(channel)) {
        _followedChannels.remove(channel);
      } else {
        _followedChannels.add(channel);
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _followedChannels.contains(channel)
              ? 'Added to your daily briefing'
              : 'Removed from your daily briefing',
          style: ObsidianTokens.bodySm(color: Colors.white),
        ),
        backgroundColor: ObsidianTokens.surfaceContainerHigh,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  List<_ChannelData> get _filteredChannels {
    if (_selectedFilterIndex == 0) return _channels;
    final filter = _filters[_selectedFilterIndex];
    if (filter == 'Followed') {
      return _channels.where((ch) => _followedChannels.contains(ch.title)).toList();
    } else if (filter == 'Macroeconomy') {
      return _channels.where((ch) => ch.categoryKey == 'macroeconomy_banking').toList();
    } else if (filter == 'Governance & Law') {
      return _channels.where((ch) => ch.categoryKey == 'governance_law').toList();
    } else if (filter == 'Delta & Climate') {
      return _channels.where((ch) => ch.categoryKey == 'climate_delta').toList();
    } else if (filter == 'Tech & Digital') {
      return _channels.where((ch) => ch.categoryKey == 'tech_infrastructure').toList();
    }
    return _channels;
  }

  void _openTopicStoriesModal(_DiscoverCardData card) {
    final matchingStories = _allStories.where((s) {
      final text = '${s.dailyBuzz.titleEn} ${s.dailyBuzz.titleBn} ${s.dailyBuzz.summaryEn} ${s.primaryCategory}'
          .toLowerCase();
      return card.filterKeywords.any((kw) => text.contains(kw.toLowerCase())) ||
          s.primaryCategory.toLowerCase().contains(card.channelTitle.toLowerCase().split(' ').first);
    }).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final isFollowed = _followedChannels.contains(card.channelTitle);

        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: BoxDecoration(
              color: const Color(0xFF0F1714).withValues(alpha: 0.95),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              children: [
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.06),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                        ),
                      ),
                      Text(
                        card.channelTitle,
                        style: ObsidianTokens.labelSm(color: ObsidianTokens.textSecondary),
                      ),
                      GestureDetector(
                        onTap: () {
                          _toggleFollow(card.channelTitle);
                          Navigator.pop(context);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isFollowed
                                ? ObsidianTokens.primaryMint.withValues(alpha: 0.15)
                                : Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            border: Border.all(
                              color: isFollowed
                                  ? ObsidianTokens.primaryMint.withValues(alpha: 0.4)
                                  : Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: Text(
                            isFollowed ? 'Following' : '+ Follow',
                            style: ObsidianTokens.labelXs(
                              color: isFollowed ? ObsidianTokens.primaryMint : Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(color: Colors.white10, height: 1),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Text(
                        card.title,
                        style: ObsidianTokens.headlineLg(color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        card.subtitle,
                        style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Recent Coverage & Analyses',
                        style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                      ),
                      const SizedBox(height: 12),
                      if (matchingStories.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.02),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                          ),
                          child: Center(
                            child: Column(
                              children: [
                                const Icon(Icons.history_edu, color: Colors.white30, size: 36),
                                const SizedBox(height: 10),
                                Text(
                                  'Curated updates will appear in your next briefing',
                                  textAlign: TextAlign.center,
                                  style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        ...matchingStories.map((story) {
                          final buzz = story.dailyBuzz;
                          final settings = AppSettingsService();
                          final isBangla = settings.isBangla;
                          final title = isBangla
                              ? (buzz.titleBn.isNotEmpty ? buzz.titleBn : buzz.titleEn)
                              : (buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn);
                          final summary = isBangla
                              ? (buzz.leadBn.isNotEmpty ? buzz.leadBn : buzz.summaryBn)
                              : (buzz.leadEn.isNotEmpty ? buzz.leadEn : buzz.summaryEn);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            padding: const EdgeInsets.all(16),
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
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                      ),
                                      child: Text(
                                        story.sources.isNotEmpty ? story.sources[0]['name'] : 'Daily Brief',
                                        style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      isBangla ? '১০ সেকেন্ড পাঠ' : '10s gist',
                                      style: ObsidianTokens.labelXs(),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  title,
                                  style: ObsidianTokens.headlineMd(color: Colors.white),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  summary,
                                  style: ObsidianTokens.bodyMd(color: ObsidianTokens.textSecondary),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 12),
                                GestureDetector(
                                  onTap: () {
                                    Navigator.pop(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => StudyCanvasScreen(story: story),
                                      ),
                                    );
                                  },
                                  child: Row(
                                    children: [
                                      Text(
                                        isBangla ? 'পুরো সংবাদ পড়ুন' : 'Read Full Story',
                                        style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.arrow_forward, size: 14, color: ObsidianTokens.primaryMint),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      const SizedBox(height: 30),
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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _searchQuery.isNotEmpty;
    final allCards = _channels.expand((ch) => ch.cards).toList();
    final allStories = _allStories;

    // 1. Search across Topic Cards
    final matchingCards = isSearching
        ? allCards.where((card) {
            return card.title.toLowerCase().contains(_searchQuery) ||
                card.subtitle.toLowerCase().contains(_searchQuery) ||
                card.channelTitle.toLowerCase().contains(_searchQuery) ||
                card.filterKeywords.any((kw) => kw.toLowerCase().contains(_searchQuery));
          }).toList()
        : <_DiscoverCardData>[];

    // 2. Search across News & In-Depth Story Contents
    final matchingStories = isSearching
        ? allStories.where((s) {
            final buzz = s.dailyBuzz;
            final bcs = s.bcsPro;
            final qText = bcs?.questionBreakdowns.map((q) => q.question).join(' ') ?? '';
            final combinedContent =
                '${buzz.titleEn} ${buzz.titleBn} ${buzz.summaryEn} ${buzz.summaryBn} '
                '${buzz.whyItMattersEn} ${buzz.whyItMattersBn} ${s.primaryCategory} '
                '${bcs?.bcsSubjectArea ?? ""} ${bcs?.syllabusMapping?.microtheme ?? ""} $qText'
                    .toLowerCase();
            return combinedContent.contains(_searchQuery);
          }).toList()
        : <CapsuleStory>[];

    final hasExactResults = matchingStories.isNotEmpty || matchingCards.isNotEmpty;

    return RefreshIndicator(
      color: ObsidianTokens.primaryMint,
      backgroundColor: ObsidianTokens.surfaceContainerHigh,
      onRefresh: () async {
        await _loadStories();
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          // 1. Top App Bar (Optional)
          if (!widget.hideTopBar)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
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
                    Text(
                      'Dorpon',
                      style: ObsidianTokens.headlineLg(color: Colors.white),
                    ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.06),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.menu, color: Colors.white, size: 20),
                  ),
                ],
              ),
            ),

          // 2. Screen Header (Clean & Centered)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Center(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Discover',
                        style: ObsidianTokens.headlineLg(color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: ObsidianTokens.primaryMint,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Search topics, news contents & customize your feed',
                    textAlign: TextAlign.center,
                    style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // 3. Central Search Capsule
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                border: Border.all(
                  color: isSearching ? ObsidianTokens.primaryMint : Colors.white.withValues(alpha: 0.09),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: ObsidianTokens.primaryMint, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      style: ObsidianTokens.bodyMd(color: Colors.white),
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val.trim().toLowerCase();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search news, topics, economics, politics...',
                        hintStyle: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary.withValues(alpha: 0.7)),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  if (isSearching)
                    GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 14),
                      ),
                    )
                  else
                    Icon(Icons.tune, color: ObsidianTokens.textSecondary, size: 18),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // 4. Functional Category Filter Chips Section
          SizedBox(
            height: 38,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final isSelected = _selectedFilterIndex == index;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedFilterIndex = index;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? ObsidianTokens.primaryMint.withValues(alpha: 0.16)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                      border: Border.all(
                        color: isSelected
                            ? ObsidianTokens.primaryMint.withValues(alpha: 0.6)
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Text(
                      _filters[index],
                      style: ObsidianTokens.labelSm(
                        color: isSelected ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                      ).copyWith(
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          // 5. Central Search Mode
          if (isSearching) ...[
            if (hasExactResults) ...[
              // Results Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    Text(
                      'Search Results for "$_searchQuery"',
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                      child: Text(
                        'Clear',
                        style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Matching News Articles Section
              if (matchingStories.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    children: [
                      const Icon(Icons.article_outlined, size: 16, color: ObsidianTokens.primaryMint),
                      const SizedBox(width: 6),
                      Text(
                        'News & In-Depth Analyses (${matchingStories.length})',
                        style: ObsidianTokens.headlineSm(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: matchingStories.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _buildSearchResultStoryCard(matchingStories[index]);
                    },
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Matching Topic Cards
              if (matchingCards.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    children: [
                      const Icon(Icons.explore_outlined, size: 16, color: ObsidianTokens.accentGold),
                      const SizedBox(width: 6),
                      Text(
                        'Topic Channels (${matchingCards.length})',
                        style: ObsidianTokens.headlineSm(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                      childAspectRatio: 0.82,
                    ),
                    itemCount: matchingCards.length,
                    itemBuilder: (context, index) {
                      return _buildCardItem(matchingCards[index]);
                    },
                  ),
                ),
              ],
            ] else ...[
              // Netflix-Style Fallback When No Exact Match Found!
              _buildNetflixFallbackView(allStories, allCards),
            ],
          ] else ...[
            // Default View: Channels Filtered by Selected Chip
            if (_filteredChannels.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.bookmark_remove_outlined, size: 40, color: ObsidianTokens.textSecondary.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      Text(
                        'No followed channels yet',
                        style: ObsidianTokens.headlineMd(color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Tap "+ Follow" on any channel to customize your daily briefing.',
                        textAlign: TextAlign.center,
                        style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._filteredChannels.map((channel) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 28),
                  child: _buildChannelSection(channel),
                );
              }),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // Netflix-Style Recommendation Fallback View
  Widget _buildNetflixFallbackView(List<CapsuleStory> allStories, List<_DiscoverCardData> allCards) {
    final recommendedStories = allStories.take(3).toList();
    final recommendedCards = allCards.take(4).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Gentle Netflix-Style Banner
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: ObsidianTokens.primaryMint.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
              border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: ObsidianTokens.primaryMint, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'No direct matches for "$_searchQuery"',
                        style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Explore these trending daily analyses and popular channels curated for you instead:',
                  style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Recommended Stories
          if (recommendedStories.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                children: [
                  const Icon(Icons.whatshot, color: ObsidianTokens.accentGold, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    'Trending News & Key Takeaways',
                    style: ObsidianTokens.headlineSm(color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ...recommendedStories.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildSearchResultStoryCard(s),
                )),
            const SizedBox(height: 20),
          ],

          // Recommended Topic Cards
          if (recommendedCards.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                children: [
                  const Icon(Icons.explore, color: ObsidianTokens.primaryMint, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    'Popular Channels & Themes',
                    style: ObsidianTokens.headlineSm(color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 0.82,
              ),
              itemCount: recommendedCards.length,
              itemBuilder: (context, index) {
                return _buildCardItem(recommendedCards[index]);
              },
            ),
          ],
        ],
      ),
    );
  }

  // Search Result Story Card
  Widget _buildSearchResultStoryCard(CapsuleStory story) {
    final buzz = story.dailyBuzz;
    final title = buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn;
    final summary = buzz.whyItMattersEn.isNotEmpty
        ? buzz.whyItMattersEn
        : (buzz.summaryEn.isNotEmpty ? buzz.summaryEn : buzz.summaryBn);
    final sourceName = story.sources.isNotEmpty ? story.sources[0]['name'] : 'Daily Brief';

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
        padding: const EdgeInsets.all(16),
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                  ),
                  child: Text(
                    sourceName,
                    style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                  ),
                ),
                const Spacer(),
                Text(
                  '${buzz.readTimeSeconds ~/ 60 + 1}m read',
                  style: ObsidianTokens.labelXs(),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: ObsidianTokens.headlineMd(color: Colors.white).copyWith(fontSize: 16),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (summary.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                summary,
                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'Read Analysis',
                  style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward_rounded, size: 14, color: ObsidianTokens.primaryMint),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Section with non-overlapping responsive layout
  Widget _buildChannelSection(_ChannelData channel) {
    final isFollowed = _followedChannels.contains(channel.title);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(channel.icon, color: ObsidianTokens.primaryMint, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        channel.title,
                        style: ObsidianTokens.headlineSm(color: Colors.white),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => _toggleFollow(channel.title),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: isFollowed
                        ? ObsidianTokens.primaryMint.withValues(alpha: 0.15)
                        : Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                    border: Border.all(
                      color: isFollowed
                          ? ObsidianTokens.primaryMint.withValues(alpha: 0.45)
                          : Colors.white.withValues(alpha: 0.12),
                    ),
                  ),
                  child: Text(
                    isFollowed ? 'Following' : '+ Follow',
                    style: ObsidianTokens.labelSm(
                      color: isFollowed ? ObsidianTokens.primaryMint : Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 185,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            scrollDirection: Axis.horizontal,
            itemCount: channel.cards.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final card = channel.cards[index];
              return _buildCardItem(card);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCardItem(_DiscoverCardData card) {
    return GestureDetector(
      onTap: () => _openTopicStoriesModal(card),
      child: Container(
        width: 240,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.035),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusLg),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(ObsidianTokens.radiusMd),
              child: Container(
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: card.gradientColors,
                  ),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Stack(
                  children: [
                    if (card.imageAsset != null && card.imageAsset!.isNotEmpty)
                      Positioned.fill(
                        child: Image.asset(
                          card.imageAsset!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                        ),
                      ),
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.15),
                              Colors.black.withValues(alpha: 0.55),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                          border: Border.all(color: card.badgeColor.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (card.isPulsing) ...[
                              Container(
                                width: 5,
                                height: 5,
                                decoration: BoxDecoration(
                                  color: card.badgeColor,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                            ],
                            Text(
                              card.badgeLabel,
                              style: TextStyle(
                                color: card.badgeColor,
                                fontSize: 10,
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
            ),
            const SizedBox(height: 10),
            Text(
              card.title,
              style: ObsidianTokens.headlineSm(color: Colors.white).copyWith(fontSize: 14),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              card.subtitle,
              style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary).copyWith(fontSize: 11),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _ChannelData {
  final String title;
  final IconData icon;
  final String categoryKey;
  final List<_DiscoverCardData> cards;

  _ChannelData({
    required this.title,
    required this.icon,
    required this.categoryKey,
    required this.cards,
  });
}

class _DiscoverCardData {
  final String title;
  final String subtitle;
  final String badgeLabel;
  final Color badgeColor;
  final bool isPulsing;
  final List<Color> gradientColors;
  final String? imageAsset;
  final String channelTitle;
  final List<String> filterKeywords;

  _DiscoverCardData({
    required this.title,
    required this.subtitle,
    required this.badgeLabel,
    required this.badgeColor,
    required this.isPulsing,
    required this.gradientColors,
    this.imageAsset,
    required this.channelTitle,
    required this.filterKeywords,
  });
}
