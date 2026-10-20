import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../services/audio_briefing_service.dart';
import '../widgets/premium_modal.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;

  const ProfileScreen({super.key, this.onBackToHome});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Mock Preferences State
  bool _isSerif = false;
  double _fontScale = 1.0;
  bool _autoPlayAudio = true;
  bool _focusMode = true;
  bool _morningBriefing = true;
  bool _breakingNews = true;
  bool _revisionReminders = false;
  int _cacheSizeMb = 128;

  // Subscription Mock State
  String _currentPlan = 'Pro Annual';
  final String _expiryDate = 'Dec 31, 2026';

  void _showSubscriptionModal() {
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
                    'Subscription Plans',
                    style: ObsidianTokens.headlineMd(color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Unlock unlimited hands-free audio briefings, in-depth issue trackers & global dossier archives.',
                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
              ),
              const SizedBox(height: 20),

              // Plan 1: Free Starter
              _buildPlanOption(
                name: 'Dorpon Free',
                price: '৳ 0 / month',
                features: [
                  '1-minute daily audio briefing preview',
                  '2 daily free Question-Led articles',
                  'Top daily stories & breaking digests',
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
                name: 'Dorpon Premium',
                subtitle: 'Annual Plan • ~৳ 66 / mo',
                price: '৳ 799 / yr',
                discountTag: 'SAVE 33%',
                features: [
                  'Full access to all Question-Led articles',
                  'Unlimited hands-free audio briefings',
                  'Historical root causes & strategic outlooks',
                  'Central Bank & economic telemetry data',
                  'Offline reading & personal reading library',
                ],
                isSelected: _currentPlan == 'Pro Annual',
                isHighlighted: true,
                onSelect: () {
                  setState(() => _currentPlan = 'Pro Annual');
                  AudioBriefingService().upgradeToPremium();
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 12),

              // Plan 3: Pro Monthly
              _buildPlanOption(
                name: 'Dorpon Monthly',
                subtitle: 'Billed monthly • Cancel anytime',
                price: '৳ 99 / mo',
                features: ['Full access to all Question-Led articles', 'Unlimited hands-free audio briefings', 'Billed monthly, cancel anytime'],
                isSelected: _currentPlan == 'Pro Monthly',
                onSelect: () {
                  setState(() => _currentPlan = 'Pro Monthly');
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
                      Text(feat, style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary)),
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
                      'Account & Preferences',
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
                          'Dorpon Reader • Premium Tier',
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
                      Row(
                        children: [
                          Stack(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    colors: [ObsidianTokens.primaryMint, Colors.transparent],
                                  ),
                                ),
                                padding: const EdgeInsets.all(2),
                                child: Container(
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: ObsidianTokens.surfaceContainerHigh,
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'AR',
                                      style: TextStyle(
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
                                    color: ObsidianTokens.primaryMint,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: ObsidianTokens.background, width: 2),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 14),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Asif Rahman',
                                    style: ObsidianTokens.headlineSm(color: Colors.white),
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
                                      'Pro',
                                      style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'asif.rahman@dorpondaily.com',
                                style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.edit, color: ObsidianTokens.textSecondary, size: 16),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Quick Stats Bento Row
                  Row(
                    children: [
                      _buildProfileStat('24', 'Saved Notes'),
                      const SizedBox(width: 8),
                      _buildProfileStat('18', 'Audio Briefs'),
                      const SizedBox(width: 8),
                      _buildProfileStat('12', 'Day Streak', icon: Icons.bolt, iconColor: ObsidianTokens.primaryMint),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // 3. Academic & Subscription Tile
            GestureDetector(
              onTap: _showSubscriptionModal,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF132A22),
                      const Color(0xFF0C1914),
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
                          child: const Text(
                            'PREMIUM ACCESS',
                            style: TextStyle(
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
                      'Dorpon Premium Member',
                      style: ObsidianTokens.headlineSm(color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Unlimited audio briefings, full in-depth issue trackers & offline reading unlocked.',
                      style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Manage Subscription',
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

            // 4. Reading Preferences Section
            _buildSectionHeader('Reading Preferences', Icons.auto_stories),
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Reading Mode Font', style: ObsidianTokens.bodyMd(color: Colors.white)),
                            const SizedBox(height: 2),
                            Text('Editorial Serif vs Sans-serif', style: ObsidianTokens.labelXs()),
                          ],
                        ),
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
                                onTap: () => setState(() => _isSerif = true),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _isSerif ? Colors.white.withOpacity(0.12) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  ),
                                  child: Text(
                                    'Serif',
                                    style: ObsidianTokens.labelXs(color: _isSerif ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _isSerif = false),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: !_isSerif ? Colors.white.withOpacity(0.12) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  ),
                                  child: Text(
                                    'Sans',
                                    style: ObsidianTokens.labelXs(color: !_isSerif ? ObsidianTokens.primaryMint : ObsidianTokens.textSecondary),
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
                    title: 'Auto-Play 6 AM Audio Brief',
                    subtitle: 'Resume morning broadcast at wake-up',
                    value: _autoPlayAudio,
                    onChanged: (val) => setState(() => _autoPlayAudio = val),
                  ),
                  Divider(color: Colors.white.withOpacity(0.05), height: 1),

                  // Focus mode
                  _buildToggleRow(
                    title: 'Distraction-Free Focus Mode',
                    subtitle: 'Mute exam countdowns during deep reading',
                    value: _focusMode,
                    onChanged: (val) => setState(() => _focusMode = val),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 5. Notifications & Digests Section
            _buildSectionHeader('Notifications & Digests', Icons.notifications_none),
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
                    title: 'Daily Morning Briefing',
                    subtitle: 'Curated audio & story capsule delivered every morning',
                    value: _morningBriefing,
                    onChanged: (val) => setState(() => _morningBriefing = val),
                  ),
                  Divider(color: Colors.white.withOpacity(0.05), height: 1),
                  _buildToggleRow(
                    title: 'Breaking News Alerts',
                    subtitle: 'Major global policies, economics & breaking affairs',
                    value: _breakingNews,
                    onChanged: (val) => setState(() => _breakingNews = val),
                  ),
                  Divider(color: Colors.white.withOpacity(0.05), height: 1),
                  _buildToggleRow(
                    title: 'Weekly Deep-Dive Summaries',
                    subtitle: 'In-depth issue tracking & weekend analytical roundups',
                    value: _revisionReminders,
                    onChanged: (val) => setState(() => _revisionReminders = val),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 6. Account & Offline Storage
            _buildSectionHeader('Account & Storage', Icons.cloud_sync_outlined),
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
                                Text('Offline Cache Size', style: ObsidianTokens.bodyMd(color: Colors.white)),
                                const SizedBox(height: 2),
                                Text('$_cacheSizeMb MB audio & cached capsules', style: ObsidianTokens.labelXs()),
                              ],
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () {
                            setState(() => _cacheSizeMb = 0);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Offline cache cleared')),
                            );
                          },
                          child: Text('Clear', style: ObsidianTokens.labelSm(color: ObsidianTokens.primaryMint)),
                        ),
                      ],
                    ),
                  ),
                  Divider(color: Colors.white.withOpacity(0.05), height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.shield_outlined, color: ObsidianTokens.textSecondary, size: 20),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Privacy & Security', style: ObsidianTokens.bodyMd(color: Colors.white)),
                                const SizedBox(height: 2),
                                Text('Encrypted personal notes storage', style: ObsidianTokens.labelXs()),
                              ],
                            ),
                          ],
                        ),
                        Icon(Icons.chevron_right, color: ObsidianTokens.textSecondary, size: 18),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 7. Footer Sign Out
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Mock Sign Out: Onboarding link will connect here.')),
                );
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
                      'Sign Out',
                      style: ObsidianTokens.labelSm(color: const Color(0xFFFFB4AB)).copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            Center(
              child: Column(
                children: [
                  Text(
                    'Dorpon Cadre Companion • Version 2.4.0 (Build 118)',
                    style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary.withOpacity(0.6)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mindful Daily Sanctuary © 2026 Dorpon',
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
