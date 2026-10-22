import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsService extends ChangeNotifier {
  static final AppSettingsService _instance = AppSettingsService._internal();
  factory AppSettingsService() => _instance;
  AppSettingsService._internal();

  // Keys
  static const String _keyLanguage = 'preferred_language'; // 'en' or 'bn'
  static const String _keyFontSerif = 'is_serif_font';
  static const String _keyAutoPlayAudio = 'auto_play_audio';
  static const String _keyFocusMode = 'focus_mode';
  static const String _keyMorningBriefing = 'morning_briefing';
  static const String _keyBreakingNews = 'breaking_news';
  static const String _keyWeeklySummaries = 'weekly_summaries';

  SharedPreferences? _prefs;

  // Settings State
  String _language = 'en'; // 'en' or 'bn'
  bool _isSerif = false;
  bool _autoPlayAudio = true;
  bool _focusMode = false;
  bool _morningBriefing = true;
  bool _breakingNews = true;
  bool _weeklySummaries = true;
  int _cacheSizeMb = 48;

  // Getters
  String get language => _language;
  bool get isBangla => _language == 'bn';
  bool get isSerif => _isSerif;
  bool get autoPlayAudio => _autoPlayAudio;
  bool get focusMode => _focusMode;
  bool get morningBriefing => _morningBriefing;
  bool get breakingNews => _breakingNews;
  bool get weeklySummaries => _weeklySummaries;
  int get cacheSizeMb => _cacheSizeMb;

  Future<void> init() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      _language = _prefs?.getString(_keyLanguage) ?? 'en';
      _isSerif = _prefs?.getBool(_keyFontSerif) ?? false;
      _autoPlayAudio = _prefs?.getBool(_keyAutoPlayAudio) ?? true;
      _focusMode = _prefs?.getBool(_keyFocusMode) ?? false;
      _morningBriefing = _prefs?.getBool(_keyMorningBriefing) ?? true;
      _breakingNews = _prefs?.getBool(_keyBreakingNews) ?? true;
      _weeklySummaries = _prefs?.getBool(_keyWeeklySummaries) ?? true;
      notifyListeners();
    } catch (_) {
      // Graceful fallback to default in-memory values if storage unavailable
    }
  }

  Future<void> setLanguage(String lang) async {
    if (lang != 'en' && lang != 'bn') return;
    _language = lang;
    notifyListeners();
    await _prefs?.setString(_keyLanguage, lang);
  }

  Future<void> toggleLanguage() async {
    final nextLang = _language == 'en' ? 'bn' : 'en';
    await setLanguage(nextLang);
  }

  Future<void> setFontSerif(bool isSerif) async {
    _isSerif = isSerif;
    notifyListeners();
    await _prefs?.setBool(_keyFontSerif, isSerif);
  }

  Future<void> setAutoPlayAudio(bool val) async {
    _autoPlayAudio = val;
    notifyListeners();
    await _prefs?.setBool(_keyAutoPlayAudio, val);
  }

  Future<void> setFocusMode(bool val) async {
    _focusMode = val;
    notifyListeners();
    await _prefs?.setBool(_keyFocusMode, val);
  }

  Future<void> setMorningBriefing(bool val) async {
    _morningBriefing = val;
    notifyListeners();
    await _prefs?.setBool(_keyMorningBriefing, val);
  }

  Future<void> setBreakingNews(bool val) async {
    _breakingNews = val;
    notifyListeners();
    await _prefs?.setBool(_keyBreakingNews, val);
  }

  Future<void> setWeeklySummaries(bool val) async {
    _weeklySummaries = val;
    notifyListeners();
    await _prefs?.setBool(_keyWeeklySummaries, val);
  }

  Future<void> clearCache() async {
    _cacheSizeMb = 0;
    notifyListeners();
  }

  /// Bilingual helper for dynamic content: returns Bangla if user preference is Bangla and available, else English.
  String localize({required String en, required String bn}) {
    if (isBangla && bn.trim().isNotEmpty) {
      return bn.trim();
    }
    return en.trim().isNotEmpty ? en.trim() : bn.trim();
  }

  /// Core UI static string translations
  String tr(String key) {
    if (isBangla) {
      return _banglaTranslations[key] ?? _englishTranslations[key] ?? key;
    }
    return _englishTranslations[key] ?? key;
  }

  static const Map<String, String> _englishTranslations = {
    'app_name': 'Sondesh Express',
    'app_tagline': 'Daily Current Affairs That Save Time',
    'good_morning': 'Good Morning,',
    'good_afternoon': 'Good Afternoon,',
    'good_evening': 'Good Evening,',
    'welcome_back': 'Welcome Back,',
    'top_stories': 'Top Stories',
    'current_affairs': 'Current Affairs',
    'discover': 'Discover',
    'saved': 'Saved',
    'profile': 'Settings',
    'listen': 'Listen',
    'playing': 'Playing',
    'explore_all': 'Explore All News',
    'view_all': 'View All',
    'read_full': 'Read Full Analysis',
    'breaking_wires': 'Breaking Wires',
    'why_in_the_news': 'Why in the News',
    'the_core_story': 'The Core Story',
    'why_it_matters': 'Why It Matters',
    'key_questions': 'Key Analysis & Insights',
    'challenges': 'Key Challenges',
    'way_forward': 'Way Forward',
    'government_initiatives': 'Key Initiatives',
    'strategic_outlook': 'Strategic Outlook',
    'settings_title': 'Account & Preferences',
    'reading_preferences': 'Reading Preferences',
    'reading_font': 'Reading Mode Font',
    'serif': 'Serif',
    'sans': 'Sans',
    'language_preference': 'App Language',
    'english': 'English',
    'bangla': 'বাংলা',
    'auto_play_audio': 'Auto-Play Audio Brief',
    'focus_mode': 'Distraction-Free Focus Mode',
    'notifications': 'Notifications & Alerts',
    'daily_briefing': 'Daily Morning Briefing',
    'breaking_alerts': 'Breaking News Alerts',
    'weekly_roundup': 'Weekly Deep-Dive Summaries',
    'storage': 'Account & Storage',
    'offline_cache': 'Offline Cache Size',
    'clear': 'Clear',
    'sign_in': 'Sign In',
    'sign_up': 'Create Account',
    'sign_out': 'Sign Out',
    'guest_user': 'Guest Reader',
    'free_plan': 'Sondesh Express Free',
    'pro_plan': 'Sondesh Express Pro',
  };

  static const Map<String, String> _banglaTranslations = {
    'app_name': 'সন্দেশ এক্সপ্রেস',
    'app_tagline': 'সময় বাঁচানো প্রতিদিনের চলতি ঘটনাবলী',
    'good_morning': 'শুভ সকাল,',
    'good_afternoon': 'শুভ দুপুর,',
    'good_evening': 'শুভ সন্ধ্যা,',
    'welcome_back': 'স্বাগতম,',
    'top_stories': 'প্রধান খবর',
    'current_affairs': 'চলতি ঘটনাবলী',
    'discover': 'অন্বেষণ',
    'saved': 'সংরক্ষিত',
    'profile': 'সেটিংস',
    'listen': 'শুনুন',
    'playing': 'চলছে',
    'explore_all': 'সব খবর দেখুন',
    'view_all': 'সব দেখুন',
    'read_full': 'সম্পূর্ণ বিশ্লেষণ পড়ুন',
    'breaking_wires': 'তাজা খবর',
    'why_in_the_news': 'সংবাদের পটভূমি',
    'the_core_story': 'মূল ঘটনা',
    'why_it_matters': 'কেন এটি গুরুত্বপূর্ণ',
    'key_questions': 'মূল বিশ্লেষণ ও অনুসন্ধান',
    'challenges': 'প্রধান চ্যালেঞ্জসমূহ',
    'way_forward': 'ভবিষ্যৎ করণীয়',
    'government_initiatives': 'সরকারি ও প্রাতিষ্ঠানিক উদ্যোগ',
    'strategic_outlook': 'কৌশলগত দৃষ্টিভঙ্গি',
    'settings_title': 'অ্যাকাউন্ট ও সেটিংস',
    'reading_preferences': 'পঠন পছন্দসমূহ',
    'reading_font': 'পঠন ফন্ট মোড',
    'serif': 'সেরিফ',
    'sans': 'স্যান্স',
    'language_preference': 'অ্যাপের ভাষা',
    'english': 'English',
    'bangla': 'বাংলা',
    'auto_play_audio': 'অডিও স্বয়ংক্রিয় প্লে',
    'focus_mode': 'মনোযোগ আকর্ষণ মোড',
    'notifications': 'বিজ্ঞপ্তি ও অ্যালার্ট',
    'daily_briefing': 'দৈনিক সকালের ব্রিফিং',
    'breaking_alerts': 'জরুরি খবর বিজ্ঞপ্তি',
    'weekly_roundup': 'সাপ্তাহিক গভীর বিশ্লেষণ',
    'storage': 'স্টোরেজ ও মেমোরি',
    'offline_cache': 'অফলাইন ক্যাশ সাইজ',
    'clear': 'মুছুন',
    'sign_in': 'লগইন করুন',
    'sign_up': 'অ্যাকাউন্ট তৈরি করুন',
    'sign_out': 'সাইন আউট',
    'guest_user': 'অতিথি পাঠক',
    'free_plan': 'সন্দেশ এক্সপ্রেস ফ্রি',
    'pro_plan': 'সন্দেশ এক্সপ্রেস প্রো',
  };
}
