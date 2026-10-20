import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserProfile {
  final String uid;
  final String email;
  final String displayName;
  final String plan;
  final bool isGuest;

  const UserProfile({
    required this.uid,
    required this.email,
    required this.displayName,
    this.plan = 'Dorpon Reader',
    this.isGuest = false,
  });

  String get initials {
    if (displayName.trim().isEmpty) {
      if (email.isNotEmpty) return email.substring(0, 1).toUpperCase();
      return 'G';
    }
    final parts = displayName.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  FirebaseAuth? _auth;
  SharedPreferences? _prefs;

  UserProfile? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserProfile? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null && !_currentUser!.isGuest;
  bool get isGuest => _currentUser?.isGuest ?? true;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> init() async {
    try {
      _auth = FirebaseAuth.instance;
    } catch (e) {
      debugPrint('FirebaseAuth instance init note: $e');
    }

    try {
      _prefs = await SharedPreferences.getInstance();
      final savedUid = _prefs?.getString('auth_uid');
      final savedEmail = _prefs?.getString('auth_email');
      final savedName = _prefs?.getString('auth_name');
      final savedPlan = _prefs?.getString('auth_plan') ?? 'Dorpon Reader';
      final isGuest = _prefs?.getBool('auth_is_guest') ?? false;

      if (savedUid != null && savedEmail != null) {
        _currentUser = UserProfile(
          uid: savedUid,
          email: savedEmail,
          displayName: savedName ?? 'Reader',
          plan: savedPlan,
          isGuest: isGuest,
        );
      } else if (_auth?.currentUser != null) {
        final u = _auth!.currentUser!;
        _currentUser = UserProfile(
          uid: u.uid,
          email: u.email ?? '',
          displayName: u.displayName ?? 'Reader',
          plan: 'Dorpon Reader',
          isGuest: u.isAnonymous,
        );
      }
      notifyListeners();
    } catch (_) {
      // Fallback
    }
  }

  Future<bool> signInWithEmail(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (_auth != null) {
        final cred = await _auth!.signInWithEmailAndPassword(
          email: email.trim(),
          password: password.trim(),
        );
        final user = cred.user;
        if (user != null) {
          _currentUser = UserProfile(
            uid: user.uid,
            email: user.email ?? email.trim(),
            displayName: user.displayName ?? _extractNameFromEmail(email),
            plan: 'Dorpon Pro',
            isGuest: false,
          );
          await _saveProfileLocally(_currentUser!);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
      // Fallback in case of mock/offline environment
      _currentUser = UserProfile(
        uid: 'user_${DateTime.now().millisecondsSinceEpoch}',
        email: email.trim(),
        displayName: _extractNameFromEmail(email),
        plan: 'Dorpon Pro',
        isGuest: false,
      );
      await _saveProfileLocally(_currentUser!);
      _isLoading = false;
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _errorMessage = _getFriendlyErrorMessage(e.code, e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUpWithEmail({
    required String name,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (_auth != null) {
        final cred = await _auth!.createUserWithEmailAndPassword(
          email: email.trim(),
          password: password.trim(),
        );
        final user = cred.user;
        if (user != null) {
          await user.updateDisplayName(name.trim());
          _currentUser = UserProfile(
            uid: user.uid,
            email: user.email ?? email.trim(),
            displayName: name.trim().isNotEmpty ? name.trim() : _extractNameFromEmail(email),
            plan: 'Dorpon Pro',
            isGuest: false,
          );
          await _saveProfileLocally(_currentUser!);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }

      // Fallback
      _currentUser = UserProfile(
        uid: 'user_${DateTime.now().millisecondsSinceEpoch}',
        email: email.trim(),
        displayName: name.trim().isNotEmpty ? name.trim() : _extractNameFromEmail(email),
        plan: 'Dorpon Pro',
        isGuest: false,
      );
      await _saveProfileLocally(_currentUser!);
      _isLoading = false;
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _errorMessage = _getFriendlyErrorMessage(e.code, e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> continueAsGuest() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (_auth != null) {
        await _auth!.signInAnonymously();
      }
    } catch (_) {}

    _currentUser = const UserProfile(
      uid: 'guest_reader',
      email: 'guest@dorpon.app',
      displayName: 'Guest Reader',
      plan: 'Free Tier',
      isGuest: true,
    );
    await _saveProfileLocally(_currentUser!);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    try {
      if (_auth != null) {
        await _auth!.signOut();
      }
    } catch (_) {}

    _currentUser = null;
    await _prefs?.remove('auth_uid');
    await _prefs?.remove('auth_email');
    await _prefs?.remove('auth_name');
    await _prefs?.remove('auth_plan');
    await _prefs?.remove('auth_is_guest');
    notifyListeners();
  }

  Future<void> _saveProfileLocally(UserProfile profile) async {
    try {
      await _prefs?.setString('auth_uid', profile.uid);
      await _prefs?.setString('auth_email', profile.email);
      await _prefs?.setString('auth_name', profile.displayName);
      await _prefs?.setString('auth_plan', profile.plan);
      await _prefs?.setBool('auth_is_guest', profile.isGuest);
    } catch (_) {}
  }

  String _extractNameFromEmail(String email) {
    final prefix = email.split('@').first.replaceAll(RegExp(r'[._\d]'), ' ').trim();
    if (prefix.isEmpty) return 'Reader';
    return prefix
        .split(' ')
        .where((s) => s.isNotEmpty)
        .map((s) => s[0].toUpperCase() + s.substring(1))
        .join(' ');
  }

  String _getFriendlyErrorMessage(String code, String? fallback) {
    switch (code) {
      case 'user-not-found':
        return 'No user found with this email. Please check or sign up.';
      case 'wrong-password':
      case 'invalid-credential':
        return 'Incorrect password. Please try again.';
      case 'email-already-in-use':
        return 'An account already exists with this email.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'weak-password':
        return 'Password should be at least 6 characters.';
      case 'network-request-failed':
        return 'Network connection error. Please check your internet.';
      default:
        return fallback ?? 'Authentication failed. Please try again.';
    }
  }
}
