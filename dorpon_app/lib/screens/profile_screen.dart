import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../services/audio_briefing_service.dart';
import '../services/app_settings_service.dart';
import '../services/auth_service.dart';
import '../widgets/auth_modal.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;

  const ProfileScreen({super.key, this.onBackToHome});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Subscription Mock State
  String _currentPlan = 'Dorpon Pro';
  final String _expiryDate = 'Dec 31, 2026';

  void _showSubscriptionModal(BuildContext context) {
    final settings = AppSettingsService();
    final isBn = settings.isBangla;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF0F1513),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Icon(Icons.workspace_premium, color: ObsidianTokens.accentGold, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    isBn ? 'সাবস্ক্রিপশন প্ল্যান' : 'Subscription Plans',
                    style: ObsidianTokens.headlineMd(color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                isBn
                    ? 'সীমাহীন অডিও ব্রিফিং, বিস্তারিত ইস্যু ট্র্যাকার ও জাতীয়-আন্তর্জাতিক বিশ্লেষণ আনলক করুন।'
                    : 'Unlock unlimited hands-free audio briefings, in-depth issue trackers & analytical dossiers.',
                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
              ),
              const SizedBox(height: 20),

              // Plan 1: Free Starter
              _buildPlanOption(
                name: 'Dorpon Free',
                price: '৳ 0 / month',
                features: isBn
                    ? [
                        'দৈনিক ১-মিনিট অডিও ব্রিফিং প্রিভিউ',
                        'প্রতিদিনের সেরা শিরোনাম ও ব্রেকিং ডাইজেস্ট',
                        'সীমাহীন সাধারণ সংবাদ পাঠ',
                      ]
                    : [
                        '1-minute daily audio briefing preview',
                        'Top daily stories & breaking digests',
                        'Unlimited core news reading',
                      ],
                isSelected: _currentPlan == 'Free',
                onSelect: () {
                  setState(() => _currentPlan = 'Free');
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 12),

              // Plan 2: Pro Annual (Recommended)
              _buildPlanOption(
                name: 'Dorpon Pro',
                subtitle: isBn ? 'বার্ষিক প্ল্যান • ~৳ ৬৬ / মাস' : 'Annual Plan • ~৳ 66 / mo',
                price: '৳ 799 / yr',
                discountTag: 'SAVE 33%',
                features: isBn
                    ? [
                        'সকল চলতি ঘটনাবলী ও গভীর বিশ্লেষণের সম্পূর্ণ অ্যাক্সেস',
                        'সীমাহীন হ্যান্ডস-ফ্রি অডিও ব্রিফিং',
                        'ঐতিহাসিক কারণ ও কৌশলগত পূর্বাভাস',
                        'কেন্দ্রীয় ব্যাংক ও অর্থনৈতিক পরিসংখ্যান ডেটা',
                        'ব্যক্তিগত বুকমার্ক ও অফলাইন রিডিং',
                      ]
                    : [
                        'Full access to all in-depth Current Affairs analysis',
                        'Unlimited hands-free audio briefings',
                        'Historical root causes & strategic outlooks',
                        'Central Bank & economic telemetry data',
                        'Offline reading & personal reading library',
                      ],
                isSelected: _currentPlan == 'Dorpon Pro',
                isHighlighted: true,
                onSelect: () {
                  setState(() => _currentPlan = 'Dorpon Pro');
                  AudioBriefingService().upgradeToPremium();
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 12),

              // Plan 3: Pro Monthly
              _buildPlanOption(
                name: 'Dorpon Monthly',
                subtitle: isBn ? 'মাসিক বিল • যেকোনো সময় বাতিলযোগ্য' : 'Billed monthly • Cancel anytime',
                price: '৳ 99 / mo',
                features: isBn
                    ? [
                        'সকল গভীর চলতি ঘটনা বিশ্লেষণের সম্পূর্ণ অ্যাক্সেস',
                        'সীমাহীন হ্যান্ডস-ফ্রি অডিও ব্রিফিং',
                        'যেকোনো সময় বাতিল করার সুবিধা',
                      ]
                    : [
                        'Full access to all in-depth Current Affairs analysis',
                        'Unlimited hands-free audio briefings',
                        'Cancel anytime',
                      ],
                isSelected: _currentPlan == 'Dorpon Monthly',
                onSelect: () {
                  setState(() => _currentPlan = 'Dorpon Monthly');
                  AudioBriefingService().upgradeToPremium();
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPlanOption({
    required String name,
    required String price,
    String? subtitle,
    String? discountTag,
    required List<String> features,
    required bool isSelected,
    bool isHighlighted = false,
    required VoidCallback onSelect,
  }) {
    return GestureDetector(
      onTap: onSelect,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? ObsidianTokens.primaryMint.withOpacity(0.08)
              : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
          border: Border.all(
            color: isSelected
                ? ObsidianTokens.primaryMint
                : isHighlighted
                    ? ObsidianTokens.accentGold.withOpacity(0.4)
                    : Colors.white.withOpacity(0.06),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: ObsidianTokens.headlineSm(color: Colors.white),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (discountTag != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.accentGold.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: ObsidianTokens.accentGold.withOpacity(0.4)),
                              ),
                              child: Text(
                                discountTag,
                                style: const TextStyle(
                                  color: ObsidianTokens.accentGold,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  price,
                  style: ObsidianTokens.headlineSm(
                    color: isHighlighted ? ObsidianTokens.primaryMint : Colors.white,
                  ).copyWith(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...features.map((feat) => Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Row(
                    children: [
                      const Icon(Icons.check, size: 14, color: ObsidianTokens.primaryMint),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          feat,
                          style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsService();
    final auth = AuthService();

    return AnimatedBuilder(
      animation: Listenable.merge([settings, auth]),
      builder: (context, _) {
        final isBn = settings.isBangla;
        final user = auth.currentUser;
        final isLoggedIn = auth.isLoggedIn;

        return Scaffold(
          backgroundColor: ObsidianTokens.background,
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 120),
              children: [
                // 1. Top Header Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () {
                        if (widget.onBackToHome != null) {
                          widget.onBackToHome!();
                        } else {
                          Navigator.maybePop(context);
                        }
                      },
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 20),
                      ),
                    ),
                    Column(
                      children: [
                        Text(
                          settings.tr('settings_title'),
                          style: ObsidianTokens.headlineMd(color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              width: 5,
                              height: 5,
                              decoration: const BoxDecoration(
                                color: ObsidianTokens.primaryMint,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              isLoggedIn
                                  ? (isBn ? 'দর্পণ প্রো সদস্য' : 'Dorpon Reader • Premium Tier')
                                  : (isBn ? 'দর্পণ অতিথি পাঠক' : 'Dorpon Reader • Free Tier'),
                              style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.help_outline, color: ObsidianTokens.textSecondary, size: 20),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // 2. User Profile Hero Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Stack(
                                  children: [
                                    Container(
                                      width: 56,
                                      height: 56,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: LinearGradient(
                                          colors: [ObsidianTokens.primaryMint, Colors.transparent],
                                        ),
                                      ),
                                      padding: const EdgeInsets.all(2),
                                      child: Container(
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: ObsidianTokens.surfaceContainerHigh,
                                        ),
                                        child: Center(
                                          child: Text(
                                            user?.initials ?? 'DP',
                                            style: const TextStyle(
                                              color: ObsidianTokens.primaryMint,
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      right: 0,
                                      child: Container(
                                        width: 14,
                                        height: 14,
                                        decoration: BoxDecoration(
                                          color: isLoggedIn ? ObsidianTokens.primaryMint : Colors.grey,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: ObsidianTokens.background, width: 2),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Flexible(
                                            child: Text(
                                              user?.displayName ?? (isBn ? 'অতিথি পাঠক' : 'Guest Reader'),
                                              style: ObsidianTokens.headlineSm(color: Colors.white),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: ObsidianTokens.primaryMint.withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                              border: Border.all(color: ObsidianTokens.primaryMint.withOpacity(0.25)),
                                            ),
                                            child: Text(
                                              isLoggedIn ? 'Pro' : 'Guest',
                                              style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        user?.email ?? (isBn ? 'লগইন করে সিঙ্ক চালু করুন' : 'Sign in to sync your bookmarks'),
                                        style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (!isLoggedIn)
                            ElevatedButton(
                              onPressed: () => AuthModal.show(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ObsidianTokens.primaryMint,
                                foregroundColor: const Color(0xFF003825),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                ),
                                elevation: 0,
                              ),
                              child: Text(
                                isBn ? 'লগইন' : 'Sign In',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            )
                          else
                            GestureDetector(
                              onTap: () => AuthModal.show(context),
                              child: Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.05),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.edit, color: ObsidianTokens.textSecondary, size: 16),
                              ),
                            ),
                        ],
                      ),

                      const SizedBox(height: 18),

                      // Quick Stats Bento Row
                      Row(
                        children: [
                          _buildProfileStat('24', isBn ? 'সংরক্ষিত' : 'Saved Notes'),
                          const SizedBox(width: 8),
                          _buildProfileStat('18', isBn ? 'অডিও ব্রিফ' : 'Audio Briefs'),
                          const SizedBox(width: 8),
                          _buildProfileStat('12', isBn ? 'দিনের স্ট্রিক' : 'Day Streak', icon: Icons.bolt, iconColor: ObsidianTokens.primaryMint),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // 3. Subscription Banner Tile
                GestureDetector(
                  onTap: () => _showSubscriptionModal(context),
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFF132A22),
                          Color(0xFF0C1914),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                      border: Border.all(color: ObsidianTokens.primaryMint.withOpacity(0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.primaryMint,
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                              ),
                              child: Text(
                                isBn ? 'প্রিমিয়াম সুবিধা' : 'PREMIUM ACCESS',
                                style: const TextStyle(
                                  color: Color(0xFF003825),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            Text(
                              'Expires $_expiryDate',
                              style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          isBn ? 'দর্পণ প্রিমিয়াম অ্যাক্সেস' : 'Dorpon Premium Member',
                          style: ObsidianTokens.headlineSm(color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isBn
                              ? 'সীমাহীন অডিও ব্রিফিং, বিস্তারিত আন্তর্জাতিক ও জাতীয় ইস্যু ট্র্যাকার আনলক করুন।'
                              : 'Unlimited audio briefings, in-depth issue trackers & offline reading unlocked.',
                          style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              isBn ? 'প্ল্যান পরিবর্তন করুন' : 'Manage Subscription',
                              style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.w600),
                            ),
                            const Icon(Icons.arrow_forward, size: 16, color: ObsidianTokens.primaryMint),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // 4. Preferred Language Section (Bangla / English)
                _buildSectionHeader(
                  settings.tr('language_preference'),
                  Icons.translate_rounded,
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isBn ? 'অ্যাপের প্রধান ভাষা' : 'App Feed & UI Language',
                              style: ObsidianTokens.bodyMd(color: Colors.white),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isBn ? 'বাংলা ও ইংরেজির মধ্যে পরিবর্তন করুন' : 'Switch between English and বাংলা',
                              style: ObsidianTokens.labelXs(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                        ),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => settings.setLanguage('en'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: !isBn ? ObsidianTokens.primaryMint.withOpacity(0.2) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  border: Border.all(
                                    color: !isBn ? ObsidianTokens.primaryMint.withOpacity(0.5) : Colors.transparent,
                                  ),
                                ),
                                child: Text(
                                  'English',
                                  style: ObsidianTokens.labelSm(
                                    color: !isBn ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                  ).copyWith(fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => settings.setLanguage('bn'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isBn ? ObsidianTokens.primaryMint.withOpacity(0.2) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  border: Border.all(
                                    color: isBn ? ObsidianTokens.primaryMint.withOpacity(0.5) : Colors.transparent,
                                  ),
                                ),
                                child: Text(
                                  'বাংলা',
                                  style: ObsidianTokens.labelSm(
                                    color: isBn ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                  ).copyWith(fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 5. Reading Preferences Section
                _buildSectionHeader(settings.tr('reading_preferences'), Icons.auto_stories),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                  ),
                  child: Column(
                    children: [
                      // Typography font switch
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    settings.tr('reading_font'),
                                    style: ObsidianTokens.bodyMd(color: Colors.white),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    isBn ? 'সম্পাদকীয় সেরিফ বনাম আধুনিক স্যান্স' : 'Editorial Serif vs Modern Sans',
                                    style: ObsidianTokens.labelXs(),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                border: Border.all(color: Colors.white.withOpacity(0.08)),
                              ),
                              child: Row(
                                children: [
                                  GestureDetector(
                                    onTap: () => settings.setFontSerif(true),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: settings.isSerif ? Colors.white.withOpacity(0.12) : Colors.transparent,
                                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                      ),
                                      child: Text(
                                        settings.tr('serif'),
                                        style: ObsidianTokens.labelXs(
                                          color: settings.isSerif ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => settings.setFontSerif(false),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: !settings.isSerif ? Colors.white.withOpacity(0.12) : Colors.transparent,
                                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                      ),
                                      child: Text(
                                        settings.tr('sans'),
                                        style: ObsidianTokens.labelXs(
                                          color: !settings.isSerif ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Divider(color: Colors.white.withOpacity(0.05), height: 1),

                      // Auto-Play 6 AM Audio Brief
                      _buildToggleRow(
                        title: settings.tr('auto_play_audio'),
                        subtitle: isBn ? 'অ্যাপ চালু করলে সকালের সারসংক্ষেপ চালু করুন' : 'Resume morning broadcast on launch',
                        value: settings.autoPlayAudio,
                        onChanged: (val) => settings.setAutoPlayAudio(val),
                      ),
                      Divider(color: Colors.white.withOpacity(0.05), height: 1),

                      // Focus mode
                      _buildToggleRow(
                        title: settings.tr('focus_mode'),
                        subtitle: isBn ? 'গভীর পড়ার সময়ে অপ্রয়োজনীয় নোটিফিকেশন বন্ধ রাখুন' : 'Silence non-essential alerts during deep reading',
                        value: settings.focusMode,
                        onChanged: (val) => settings.setFocusMode(val),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 6. Notifications & Digests Section
                _buildSectionHeader(settings.tr('notifications'), Icons.notifications_none),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                  ),
                  child: Column(
                    children: [
                      _buildToggleRow(
                        title: settings.tr('daily_briefing'),
                        subtitle: isBn ? 'প্রতিদিন সকালে কিউরেটেড অডিও ও সংবাদ ক্যাপসুল' : 'Curated audio & story capsule delivered every morning',
                        value: settings.morningBriefing,
                        onChanged: (val) => settings.setMorningBriefing(val),
                      ),
                      Divider(color: Colors.white.withOpacity(0.05), height: 1),
                      _buildToggleRow(
                        title: settings.tr('breaking_alerts'),
                        subtitle: isBn ? 'জাতীয় নীতি, অর্থনীতি ও জরুরি চলতি ঘটনা' : 'Major policy, economic & breaking developments',
                        value: settings.breakingNews,
                        onChanged: (val) => settings.setBreakingNews(val),
                      ),
                      Divider(color: Colors.white.withOpacity(0.05), height: 1),
                      _buildToggleRow(
                        title: settings.tr('weekly_roundup'),
                        subtitle: isBn ? 'সাপ্তাহিক গভীর পর্যবেক্ষণ ও বিশ্লেষণী সারাংশ' : 'In-depth issue tracking & weekend analytical roundups',
                        value: settings.weeklySummaries,
                        onChanged: (val) => settings.setWeeklySummaries(val),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 7. Account & Storage Section
                _buildSectionHeader(settings.tr('storage'), Icons.cloud_sync_outlined),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                    border: Border.all(color: Colors.white.withOpacity(0.07)),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.download_for_offline_outlined, color: ObsidianTokens.textSecondary, size: 20),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(settings.tr('offline_cache'), style: ObsidianTokens.bodyMd(color: Colors.white)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${settings.cacheSizeMb} MB ${isBn ? "সংরক্ষিত ডেটা" : "cached audio & stories"}',
                                      style: ObsidianTokens.labelXs(),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            GestureDetector(
                              onTap: () async {
                                await settings.clearCache();
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(isBn ? 'ক্যাশ মেমোরি পরিষ্কার করা হয়েছে' : 'Offline cache cleared'),
                                    ),
                                  );
                                }
                              },
                              child: Text(
                                settings.tr('clear'),
                                style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 8. Sign In / Sign Out Button
                if (isLoggedIn)
                  GestureDetector(
                    onTap: () async {
                      await auth.signOut();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(isBn ? 'সফলভাবে সাইন আউট করা হয়েছে' : 'Signed out successfully'),
                          ),
                        );
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                        border: Border.all(color: Colors.white.withOpacity(0.06)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.logout, color: Color(0xFFFFB4AB), size: 18),
                          const SizedBox(width: 8),
                          Text(
                            settings.tr('sign_out'),
                            style: ObsidianTokens.labelSm(color: const Color(0xFFFFB4AB)).copyWith(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => AuthModal.show(context),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: ObsidianTokens.primaryMint.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                        border: Border.all(color: ObsidianTokens.primaryMint.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.login_rounded, color: ObsidianTokens.primaryMint, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            settings.tr('sign_in'),
                            style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint).copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 24),

                Center(
                  child: Column(
                    children: [
                      Text(
                        'Dorpon Daily • Version 2.4.0',
                        style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary.withOpacity(0.6)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'AI-Powered Daily Intelligence © 2026 Dorpon',
                        style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary.withOpacity(0.4)),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileStat(String value, String label, {IconData? icon, Color? iconColor}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusMd),
          border: Border.all(color: Colors.white.withOpacity(0.04)),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: ObsidianTokens.headlineSm(color: Colors.white),
                ),
                if (icon != null) ...[
                  const SizedBox(width: 4),
                  Icon(icon, color: iconColor, size: 14),
                ],
              ],
            ),
            const SizedBox(height: 2),
            Text(label, style: ObsidianTokens.labelXs()),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title.toUpperCase(),
          style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary).copyWith(
            letterSpacing: 1.1,
            fontWeight: FontWeight.w600,
          ),
        ),
        Icon(icon, size: 16, color: ObsidianTokens.textSecondary),
      ],
    );
  }

  Widget _buildToggleRow({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: ObsidianTokens.bodyMd(color: Colors.white)),
                const SizedBox(height: 2),
                Text(subtitle, style: ObsidianTokens.labelXs()),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: ObsidianTokens.primaryMint,
            activeTrackColor: ObsidianTokens.primaryMint.withOpacity(0.3),
            inactiveThumbColor: ObsidianTokens.textSecondary,
            inactiveTrackColor: Colors.white.withOpacity(0.06),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
