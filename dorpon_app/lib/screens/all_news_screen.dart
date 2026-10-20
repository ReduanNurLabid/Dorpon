import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/api_service.dart';
import '../services/saved_articles_service.dart';
import '../services/app_settings_service.dart';
import '../widgets/ambient_background.dart';
import 'study_canvas_screen.dart';

class AllNewsScreen extends StatefulWidget {
  final List<CapsuleStory>? initialStories;

  const AllNewsScreen({super.key, this.initialStories});

  @override
  State<AllNewsScreen> createState() => _AllNewsScreenState();
}

class _AllNewsScreenState extends State<AllNewsScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<CapsuleStory> _stories = [];
  bool _isLoading = true;
  String _searchQuery = '';
  int _selectedFilterIndex = 0;

  final List<String> _filters = [
    'All Stories',
    'Today',
    'Previous History',
    'Dhaka Tribune',
    'Bangla Tribune',
    'Prothom Alo',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialStories != null && widget.initialStories!.isNotEmpty) {
      _stories = widget.initialStories!;
      _isLoading = false;
    }
    _loadAllNews();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAllNews() async {
    final results = await ApiService.fetchAllNewsArchive();
    if (mounted) {
      setState(() {
        _stories = results;
        _isLoading = false;
      });
    }
  }

  List<CapsuleStory> get _filteredStories {
    var list = _stories;

    // Filter by category / time chip
    if (_selectedFilterIndex == 1) {
      // Today
      final now = DateTime.now();
      list = list.where((s) {
        final dt = DateTime.tryParse(s.publishedAt)?.toLocal();
        if (dt == null) return true;
        return dt.year == now.year && dt.month == now.month && dt.day == now.day;
      }).toList();
    } else if (_selectedFilterIndex == 2) {
      // Previous History
      final now = DateTime.now();
      list = list.where((s) {
        final dt = DateTime.tryParse(s.publishedAt)?.toLocal();
        if (dt == null) return false;
        return !(dt.year == now.year && dt.month == now.month && dt.day == now.day);
      }).toList();
    } else if (_selectedFilterIndex == 3) {
      list = list.where((s) => s.sources.any((src) => (src['name'] ?? '').toString().toLowerCase().contains('dhaka tribune'))).toList();
    } else if (_selectedFilterIndex == 4) {
      list = list.where((s) => s.sources.any((src) => (src['name'] ?? '').toString().toLowerCase().contains('bangla tribune'))).toList();
    } else if (_selectedFilterIndex == 5) {
      list = list.where((s) => s.sources.any((src) => (src['name'] ?? '').toString().toLowerCase().contains('prothom alo') || (src['name'] ?? '').toString().contains('প্রথম আলো'))).toList();
    }

    // Search query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      list = list.where((s) {
        final title = '${s.dailyBuzz.titleEn} ${s.dailyBuzz.titleBn}'.toLowerCase();
        final summary = '${s.dailyBuzz.summaryEn} ${s.dailyBuzz.summaryBn}'.toLowerCase();
        final source = s.sources.isNotEmpty ? (s.sources[0]['name'] ?? '').toString().toLowerCase() : '';
        return title.contains(q) || summary.contains(q) || source.contains(q);
      }).toList();
    }

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredStories;

    return Scaffold(
      backgroundColor: ObsidianTokens.background,
      body: AmbientBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // 1. Top Header Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'All News & History',
                                style: ObsidianTokens.headlineMd(color: Colors.white).copyWith(fontSize: 18),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '${_stories.length} WIRES',
                                  style: const TextStyle(
                                    color: ObsidianTokens.primaryMint,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Chronological live wires & past editorial archives',
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Search Field
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                child: Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: const TextStyle(color: Colors.white, fontSize: 13.5),
                    decoration: InputDecoration(
                      hintText: 'Search headline, topic, or publisher...',
                      hintStyle: TextStyle(color: ObsidianTokens.textSecondary.withValues(alpha: 0.6), fontSize: 13),
                      prefixIcon: const Icon(Icons.search, color: ObsidianTokens.textSecondary, size: 18),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? GestureDetector(
                              onTap: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                              child: const Icon(Icons.clear, color: ObsidianTokens.textSecondary, size: 16),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),

              // 3. Filter Chips Row
              SizedBox(
                height: 40,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  scrollDirection: Axis.horizontal,
                  itemCount: _filters.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final isSelected = _selectedFilterIndex == index;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedFilterIndex = index),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? ObsidianTokens.primaryMint.withValues(alpha: 0.16)
                              : Colors.white.withValues(alpha: 0.04),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                          border: Border.all(
                            color: isSelected
                                ? ObsidianTokens.primaryMint.withValues(alpha: 0.6)
                                : Colors.white.withValues(alpha: 0.07),
                          ),
                        ),
                        child: Text(
                          _filters[index],
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 6),

              // 4. Scrollable Chronological Story List
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: ObsidianTokens.primaryMint),
                      )
                    : filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.history_edu_rounded, color: Colors.white24, size: 48),
                                const SizedBox(height: 12),
                                Text(
                                  'No stories match your filter',
                                  style: ObsidianTokens.bodyMd(color: ObsidianTokens.textSecondary),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            color: ObsidianTokens.primaryMint,
                            backgroundColor: ObsidianTokens.surfaceContainerHigh,
                            onRefresh: _loadAllNews,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 40, top: 8),
                              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final story = filtered[index];
                                return _buildNewsTile(story);
                              },
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNewsTile(CapsuleStory story) {
    final settings = AppSettingsService();
    final buzz = story.dailyBuzz;
    final sourceName = story.sources.isNotEmpty ? story.sources[0]['name'] : 'News Wire';
    final title = settings.localize(en: buzz.titleEn, bn: buzz.titleBn);
    final takeaway = settings.localize(en: buzz.whyItMattersEn, bn: buzz.whyItMattersBn);
    final readMins = buzz.readTimeSeconds > 0 ? (buzz.readTimeSeconds ~/ 60 + 1) : 1;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Source & Published Timestamp Header
              Row(
                children: [
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                        border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        sourceName,
                        style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  if (story.formattedPublishedTime.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    const Icon(Icons.schedule, size: 11, color: ObsidianTokens.textSecondary),
                    const SizedBox(width: 3),
                    Text(
                      story.formattedPublishedTime,
                      style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                    ),
                  ],
                  const Spacer(),
                  Text(
                    '$readMins min read',
                    style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                  ),
                  const SizedBox(width: 6),
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
                ],
              ),
              const SizedBox(height: 10),

              // Headline
              Text(
                title,
                style: ObsidianTokens.headlineMd(color: Colors.white).copyWith(fontSize: 15, height: 1.3),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Takeaway / Summary
              Text(
                takeaway,
                style: ObsidianTokens.bodyMd().copyWith(fontSize: 12.5, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),

              // Read Full Story Link
              Row(
                children: [
                  Text(
                    settings.tr('read_full'),
                    style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_rounded, size: 13, color: ObsidianTokens.primaryMint),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
