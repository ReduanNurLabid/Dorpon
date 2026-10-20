import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../services/auth_service.dart';
import '../services/app_settings_service.dart';

class AuthModal extends StatefulWidget {
  final bool initialIsSignUp;

  const AuthModal({super.key, this.initialIsSignUp = false});

  static Future<void> show(BuildContext context, {bool initialIsSignUp = false}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AuthModal(initialIsSignUp: initialIsSignUp),
    );
  }

  @override
  State<AuthModal> createState() => _AuthModalState();
}

class _AuthModalState extends State<AuthModal> {
  late bool _isSignUp;
  bool _obscurePassword = true;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _isSignUp = widget.initialIsSignUp;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthService();

    bool success;
    if (_isSignUp) {
      success = await auth.signUpWithEmail(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    } else {
      success = await auth.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
    }

    if (mounted) {
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0F261E),
            content: Text(
              _isSignUp ? 'Account created successfully! Welcome to Dorpon.' : 'Signed in successfully!',
              style: const TextStyle(color: ObsidianTokens.primaryMint),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    final settings = AppSettingsService();
    final isBn = settings.isBangla;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF111714),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Top Switcher: Sign In vs Sign Up
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isSignUp = false),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !_isSignUp ? ObsidianTokens.primaryMint.withOpacity(0.18) : Colors.transparent,
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                              border: Border.all(
                                color: !_isSignUp ? ObsidianTokens.primaryMint.withOpacity(0.4) : Colors.transparent,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                isBn ? 'লগইন' : 'Sign In',
                                style: ObsidianTokens.labelSm(
                                  color: !_isSignUp ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                ).copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isSignUp = true),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _isSignUp ? ObsidianTokens.primaryMint.withOpacity(0.18) : Colors.transparent,
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                              border: Border.all(
                                color: _isSignUp ? ObsidianTokens.primaryMint.withOpacity(0.4) : Colors.transparent,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                isBn ? 'নতুন অ্যাকাউন্ট' : 'Create Account',
                                style: ObsidianTokens.labelSm(
                                  color: _isSignUp ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                ).copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Header
                Text(
                  _isSignUp
                      ? (isBn ? 'দর্পণ-এ স্বাগতম' : 'Join Dorpon')
                      : (isBn ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'Welcome Back'),
                  style: ObsidianTokens.headlineMd(color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  _isSignUp
                      ? (isBn
                          ? 'পছন্দের ক্যাটাগরি, বুকমার্ক ও সংরক্ষিত রিপোর্ট সিঙ্ক করতে নিবন্ধন করুন।'
                          : 'Sign up to sync your bookmarks, audio briefing position & preferences.')
                      : (isBn
                          ? 'আপনার দৈনিক নিউজ পোর্টাল ও বিশ্লেষণে প্রবেশ করুন।'
                          : 'Access your curated daily intelligence & reading list.'),
                  style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                ),

                const SizedBox(height: 20),

                // Error Banner
                AnimatedBuilder(
                  animation: auth,
                  builder: (context, _) {
                    if (auth.errorMessage == null) return const SizedBox.shrink();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x33FFB4AB),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                        border: Border.all(color: const Color(0xFFFFB4AB).withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFFFB4AB), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              auth.errorMessage!,
                              style: const TextStyle(color: Color(0xFFFFB4AB), fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),

                // Full Name field (only for signup)
                if (_isSignUp) ...[
                  Text(
                    isBn ? 'পূর্ণ নাম' : 'Full Name',
                    style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration(
                      hint: isBn ? 'আপনার নাম লিখুন' : 'e.g. Asif Rahman',
                      icon: Icons.person_outline,
                    ),
                    validator: (val) {
                      if (_isSignUp && (val == null || val.trim().isEmpty)) {
                        return isBn ? 'অনুগ্রহ করে আপনার নাম দিন' : 'Please enter your name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                ],

                // Email field
                Text(
                  isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address',
                  style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Colors.white),
                  decoration: _inputDecoration(
                    hint: isBn ? 'নাম@উদাহরণ.কম' : 'name@example.com',
                    icon: Icons.alternate_email,
                  ),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return isBn ? 'ইমেইল দিন' : 'Please enter an email';
                    }
                    if (!val.contains('@') || !val.contains('.')) {
                      return isBn ? 'সঠিক ইমেইল ফরম্যাট দিন' : 'Enter a valid email address';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Password field
                Text(
                  isBn ? 'পাসওয়ার্ড' : 'Password',
                  style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: Colors.white),
                  decoration: _inputDecoration(
                    hint: '••••••••',
                    icon: Icons.lock_outline,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: ObsidianTokens.textSecondary,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (val) {
                    if (val == null || val.length < 6) {
                      return isBn ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' : 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Submit Button
                AnimatedBuilder(
                  animation: auth,
                  builder: (context, _) {
                    return SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ObsidianTokens.primaryMint,
                          foregroundColor: const Color(0xFF003825),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                          ),
                          elevation: 0,
                        ),
                        onPressed: auth.isLoading ? null : _handleSubmit,
                        child: auth.isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Color(0xFF003825),
                                ),
                              )
                            : Text(
                                _isSignUp
                                    ? (isBn ? 'নিবন্ধন সম্পন্ন করুন' : 'Create Account')
                                    : (isBn ? 'লগইন করুন' : 'Sign In'),
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 16),

                // Guest option
                Center(
                  child: TextButton(
                    onPressed: () async {
                      await auth.continueAsGuest();
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                    },
                    child: Text(
                      isBn ? 'অতিথি হিসেবে চালিয়ে যান' : 'Continue as Guest Reader',
                      style: ObsidianTokens.labelSm(color: ObsidianTokens.textSecondary),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      filled: true,
      fillColor: Colors.white.withOpacity(0.04),
      prefixIcon: Icon(icon, color: ObsidianTokens.textSecondary, size: 20),
      suffixIcon: suffixIcon,
      hintText: hint,
      hintStyle: TextStyle(color: ObsidianTokens.textSecondary.withOpacity(0.5), fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
        borderSide: const BorderSide(color: ObsidianTokens.primaryMint, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
        borderSide: const BorderSide(color: Color(0xFFFFB4AB)),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
        borderSide: const BorderSide(color: Color(0xFFFFB4AB), width: 1.5),
      ),
    );
  }
}
