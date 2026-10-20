import 'package:flutter/foundation.dart';
import '../models/capsule_models.dart';

class SavedArticlesService extends ChangeNotifier {
  static final SavedArticlesService _instance = SavedArticlesService._internal();
  factory SavedArticlesService() => _instance;
  SavedArticlesService._internal();

  final List<CapsuleStory> _savedStories = [];

  List<CapsuleStory> get savedStories => List.unmodifiable(_savedStories);

  bool isStorySaved(String storyId) {
    return _savedStories.any((s) => s.storyId == storyId);
  }

  void toggleSaveStory(CapsuleStory story) {
    final index = _savedStories.indexWhere((s) => s.storyId == story.storyId);
    if (index >= 0) {
      _savedStories.removeAt(index);
    } else {
      _savedStories.insert(0, story);
    }
    notifyListeners();
  }

  void removeStory(String storyId) {
    _savedStories.removeWhere((s) => s.storyId == storyId);
    notifyListeners();
  }

  void clearAll() {
    _savedStories.clear();
    notifyListeners();
  }
}
