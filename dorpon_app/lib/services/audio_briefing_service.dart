import 'dart:async';
import 'package:flutter/material.dart';
import '../models/capsule_models.dart';

class AudioChapter {
  final String title;
  final String titleEn;
  final String titleBn;
  final String categorySlug;
  final String category;
  final Duration startTime;
  final Duration duration;
  final String? storyId;

  AudioChapter({
    required this.title,
    this.titleEn = '',
    this.titleBn = '',
    this.categorySlug = '',
    this.category = '',
    required this.startTime,
    required this.duration,
    this.storyId,
  });

  String getTitle(bool isBangla) {
    if (isBangla && titleBn.trim().isNotEmpty) return titleBn.trim();
    if (!isBangla && titleEn.trim().isNotEmpty) return titleEn.trim();
    return title;
  }

  String getCategory(bool isBangla) {
    if (categorySlug.isNotEmpty) {
      return getLocalizedCategory(categorySlug, isBangla);
    }
    return getLocalizedCategory(category, isBangla);
  }
}

class AudioBriefingService extends ChangeNotifier {
  static final AudioBriefingService _instance = AudioBriefingService._internal();
  factory AudioBriefingService() => _instance;
  AudioBriefingService._internal();

  bool _isPlayerVisible = false;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _totalDuration = const Duration(minutes: 4, seconds: 30);
  double _playbackSpeed = 1.0;
  String _language = 'en'; // 'en' or 'bn'
  int _activeChapterIndex = 0;
  Timer? _tickerTimer;

  bool _isPremiumUser = false;
  static const Duration freeAudioLimit = Duration(seconds: 60);
  bool _hasHitFreeLimit = false;
  bool _isTransitioning = false;
  bool get isTransitioning => _isTransitioning;

  List<AudioChapter> _chapters = [
    AudioChapter(
      title: 'Central Bank Policy & Core Inflation Pulse',
      titleEn: 'Central Bank Policy & Core Inflation Pulse',
      titleBn: 'কেন্দ্রীয় ব্যাংক নীতি ও মূল মূল্যস্ফীতি বিশ্লেষণ',
      categorySlug: 'macroeconomy_banking',
      category: 'Macroeconomy',
      startTime: Duration.zero,
      duration: const Duration(seconds: 70),
    ),
    AudioChapter(
      title: 'Forex Reserves & NBR Trade Telemetry',
      titleEn: 'Forex Reserves & NBR Trade Telemetry',
      titleBn: 'বৈদেশিক মুদ্রার রিজার্ভ ও এনবিআর রাজস্ব তথ্য',
      categorySlug: 'economy_business',
      category: 'Trade & Forex',
      startTime: const Duration(seconds: 70),
      duration: const Duration(seconds: 65),
    ),
    AudioChapter(
      title: 'Judicial Writs & Article 102 High Court Directives',
      titleEn: 'Judicial Writs & Article 102 High Court Directives',
      titleBn: 'বিচার বিভাগীয় রিট ও ১০২ অনুচ্ছেদের আওতায় হাইকোর্টের নির্দেশনা',
      categorySlug: 'governance_law',
      category: 'Governance & Law',
      startTime: const Duration(seconds: 135),
      duration: const Duration(seconds: 75),
    ),
    AudioChapter(
      title: 'Delta Plan 2100 & Climate Adaptation Funding',
      titleEn: 'Delta Plan 2100 & Climate Adaptation Funding',
      titleBn: 'ডেল্টা প্ল্যান ২১০০ ও জলবায়ু অভিযোজন অর্থায়ন',
      categorySlug: 'climate_delta',
      category: 'Climate & Delta',
      startTime: const Duration(seconds: 210),
      duration: const Duration(seconds: 60),
    ),
  ];

  // Getters
  bool get isPlayerVisible => _isPlayerVisible;
  bool get isPlaying => _isPlaying;
  Duration get position => _position;
  Duration get totalDuration => _totalDuration;
  double get playbackSpeed => _playbackSpeed;
  String get language => _language;
  int get activeChapterIndex => _activeChapterIndex;
  List<AudioChapter> get chapters => _chapters;
  bool get isPremiumUser => _isPremiumUser;
  bool get hasHitFreeLimit => _hasHitFreeLimit;

  void upgradeToPremium() {
    _isPremiumUser = true;
    _hasHitFreeLimit = false;
    notifyListeners();
  }

  AudioChapter get currentChapter => _chapters.isNotEmpty
      ? _chapters[_activeChapterIndex.clamp(0, _chapters.length - 1)]
      : AudioChapter(
          title: 'Dorpon Daily Briefing',
          category: 'Briefing',
          startTime: Duration.zero,
          duration: const Duration(minutes: 4),
        );

  String get formattedPosition => _formatDuration(_position);
  String get formattedTotalDuration => _formatDuration(_totalDuration);
  String get formattedRemainingTime => _formatDuration(_totalDuration - _position);

  double get progressRatio => _totalDuration.inMilliseconds > 0
      ? (_position.inMilliseconds / _totalDuration.inMilliseconds).clamp(0.0, 1.0)
      : 0.0;

  void loadEditionStories(List<CapsuleStory> stories) {
    if (stories.isEmpty) return;
    
    int accumulatedSeconds = 0;
    final List<AudioChapter> generatedChapters = [];

    for (var i = 0; i < stories.length; i++) {
      final story = stories[i];
      final buzz = story.dailyBuzz;
      final titleEn = buzz.titleEn.isNotEmpty ? buzz.titleEn : buzz.titleBn;
      final titleBn = buzz.titleBn.isNotEmpty ? buzz.titleBn : buzz.titleEn;
      final title = _language == 'bn' && titleBn.isNotEmpty ? titleBn : titleEn;
      final durationSec = buzz.readTimeSeconds > 0 ? buzz.readTimeSeconds : 65;
      
      generatedChapters.add(
        AudioChapter(
          title: title.isNotEmpty ? title : 'Daily Dispatch #${i + 1}',
          titleEn: titleEn,
          titleBn: titleBn,
          categorySlug: story.primaryCategory,
          category: getLocalizedCategory(story.primaryCategory, _language == 'bn'),
          startTime: Duration(seconds: accumulatedSeconds),
          duration: Duration(seconds: durationSec),
          storyId: story.storyId,
        ),
      );
      accumulatedSeconds += durationSec;
    }

    _chapters = generatedChapters;
    _totalDuration = Duration(seconds: accumulatedSeconds > 0 ? accumulatedSeconds : 270);
    notifyListeners();
  }

  void playBriefing({List<CapsuleStory>? stories, int startChapterIndex = 0}) {
    if (stories != null && stories.isNotEmpty) {
      loadEditionStories(stories);
    }
    _activeChapterIndex = startChapterIndex.clamp(0, _chapters.length - 1);
    if (_chapters.isNotEmpty) {
      _position = _chapters[_activeChapterIndex].startTime;
    }
    _isPlayerVisible = true;
    _isPlaying = true;
    _startTicker();
    notifyListeners();
  }

  void togglePlay() {
    if (!_isPlayerVisible) {
      _isPlayerVisible = true;
    }
    _isPlaying = !_isPlaying;
    if (_isPlaying) {
      _startTicker();
    } else {
      _tickerTimer?.cancel();
    }
    notifyListeners();
  }

  void pause() {
    if (_isPlaying) {
      _isPlaying = false;
      _tickerTimer?.cancel();
      notifyListeners();
    }
  }

  void seekTo(Duration newPosition) {
    _position = Duration(
      milliseconds: newPosition.inMilliseconds.clamp(0, _totalDuration.inMilliseconds),
    );
    _updateActiveChapterFromPosition();
    notifyListeners();
  }

  void seekRatio(double ratio) {
    final ms = (_totalDuration.inMilliseconds * ratio.clamp(0.0, 1.0)).round();
    seekTo(Duration(milliseconds: ms));
  }

  void skipSeconds(int seconds) {
    seekTo(_position + Duration(seconds: seconds));
  }

  void jumpToChapter(int index) {
    if (index >= 0 && index < _chapters.length) {
      _activeChapterIndex = index;
      _position = _chapters[index].startTime;
      if (!_isPlaying) {
        _isPlaying = true;
        _startTicker();
      }
      notifyListeners();
    }
  }

  void nextChapter() {
    if (_activeChapterIndex < _chapters.length - 1) {
      _isTransitioning = true;
      notifyListeners();
      Future.delayed(const Duration(milliseconds: 1400), () {
        _isTransitioning = false;
        jumpToChapter(_activeChapterIndex + 1);
      });
    } else {
      seekTo(_totalDuration);
      pause();
    }
  }

  void previousChapter() {
    if (_position - currentChapter.startTime > const Duration(seconds: 3)) {
      seekTo(currentChapter.startTime);
    } else if (_activeChapterIndex > 0) {
      jumpToChapter(_activeChapterIndex - 1);
    } else {
      seekTo(Duration.zero);
    }
  }

  void cyclePlaybackSpeed() {
    if (_playbackSpeed == 1.0) {
      _playbackSpeed = 1.25;
    } else if (_playbackSpeed == 1.25) {
      _playbackSpeed = 1.5;
    } else if (_playbackSpeed == 1.5) {
      _playbackSpeed = 2.0;
    } else if (_playbackSpeed == 2.0) {
      _playbackSpeed = 0.8;
    } else {
      _playbackSpeed = 1.0;
    }
    if (_isPlaying) {
      _startTicker();
    }
    notifyListeners();
  }

  void toggleLanguage() {
    _language = _language == 'en' ? 'bn' : 'en';
    notifyListeners();
  }

  void closePlayer() {
    _isPlaying = false;
    _isPlayerVisible = false;
    _tickerTimer?.cancel();
    notifyListeners();
  }

  void _startTicker() {
    _tickerTimer?.cancel();
    final intervalMs = (1000 / _playbackSpeed).round();
    _tickerTimer = Timer.periodic(Duration(milliseconds: intervalMs), (timer) {
      if (!_isPlaying) {
        timer.cancel();
        return;
      }

      // Check Free Tier 1-Minute Daily Audio Limit
      if (!_isPremiumUser && _position >= freeAudioLimit) {
        _position = freeAudioLimit;
        _isPlaying = false;
        _hasHitFreeLimit = true;
        timer.cancel();
        notifyListeners();
        return;
      }

      if (_position >= _totalDuration) {
        _position = _totalDuration;
        _isPlaying = false;
        timer.cancel();
        notifyListeners();
        return;
      }
      _position += const Duration(seconds: 1);
      _updateActiveChapterFromPosition();
      notifyListeners();
    });
  }

  void _updateActiveChapterFromPosition() {
    for (int i = _chapters.length - 1; i >= 0; i--) {
      if (_position >= _chapters[i].startTime) {
        if (_activeChapterIndex != i) {
          _activeChapterIndex = i;
        }
        break;
      }
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _tickerTimer?.cancel();
    super.dispose();
  }
}
