import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../services/audio_briefing_service.dart';

class PremiumModal {
  static void show(
    BuildContext context, {
    String title = 'Unlock Dorpon Premium',
    String subtitle = 'Experience unlimited audio briefings and complete in-depth issue trackers.',
    String ctaText = 'Upgrade to Premium • ৳ 99/mo',
    IconData icon = Icons.workspace_premium,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PremiumSheet(
        title: title,
        subtitle: subtitle,
        ctaText: ctaText,
        icon: icon,
      ),
    );
  }
}

class _PremiumSheet extends StatefulWidget {
  final String title;
  final String subtitle;
  final String ctaText;
  final IconData icon;

  const _PremiumSheet({
    required this.title,
    required this.subtitle,
    required this.ctaText,
    required this.icon,
  });

  @override
  State<_PremiumSheet> createState() => _PremiumSheetState();
}

class _PremiumSheetState extends State<_PremiumSheet> {
  int _selectedPlanIndex = 0; // 0: Annual (Best Value), 1: Monthly

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 36,
      ),
      decoration: BoxDecoration(
        color: ObsidianTokens.surfaceContainerLowest,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.8),
            blurRadius: 32,
            spreadRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Glowing Crown Badge
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  ObsidianTokens.accentGold.withValues(alpha: 0.3),
                  ObsidianTokens.accentGold.withValues(alpha: 0.05),
                ],
              ),
              border: Border.all(color: ObsidianTokens.accentGold.withValues(alpha: 0.4), width: 1.5),
            ),
            child: Icon(widget.icon, color: ObsidianTokens.accentGold, size: 28),
          ),
          const SizedBox(height: 16),

          // Title & Subtitle
          Text(
            widget.title,
            textAlign: TextAlign.center,
            style: ObsidianTokens.headlineMd(color: Colors.white).copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.subtitle,
            textAlign: TextAlign.center,
            style: ObsidianTokens.bodySm(color: ObsidianTokens.textSecondary).copyWith(
              height: 1.45,
            ),
          ),
          const SizedBox(height: 24),

          // Premium Value Props
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              children: [
                _buildBenefitRow(
                  Icons.headphones_rounded,
                  'Full Audio Briefings',
                  'Unlimited hands-free listening across all stories (free plan limited to 1 min).',
                  ObsidianTokens.primaryMint,
                ),
                const SizedBox(height: 12),
                _buildBenefitRow(
                  Icons.auto_awesome_rounded,
                  'All Full Question-Led Articles',
                  'Unlimited access to all Current Affairs deep dives, historical root causes & strategic editorial breakdowns.',
                  ObsidianTokens.accentGold,
                ),
                const SizedBox(height: 12),
                _buildBenefitRow(
                  Icons.offline_bolt_outlined,
                  'Offline Sync & Archive',
                  'Download editions for offline commute reading & bookmark key telemetry.',
                  Colors.tealAccent,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Tier Options (Annual vs Monthly)
          Row(
            children: [
              // Option 1: Annual
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedPlanIndex = 0),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _selectedPlanIndex == 0
                          ? ObsidianTokens.accentGold.withValues(alpha: 0.12)
                          : Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                      border: Border.all(
                        color: _selectedPlanIndex == 0
                            ? ObsidianTokens.accentGold
                            : Colors.white.withValues(alpha: 0.08),
                        width: _selectedPlanIndex == 0 ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Annual',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: ObsidianTokens.accentGold,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'SAVE 33%',
                                style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          '৳ 799 / yr',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          'approx ৳ 66 / mo',
                          style: TextStyle(color: ObsidianTokens.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Option 2: Monthly
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedPlanIndex = 1),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _selectedPlanIndex == 1
                          ? ObsidianTokens.primaryMint.withValues(alpha: 0.12)
                          : Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                      border: Border.all(
                        color: _selectedPlanIndex == 1
                            ? ObsidianTokens.primaryMint
                            : Colors.white.withValues(alpha: 0.08),
                        width: _selectedPlanIndex == 1 ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Monthly',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          '৳ 99 / mo',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          'Billed monthly',
                          style: TextStyle(color: ObsidianTokens.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // Upgrade CTA Button
          GestureDetector(
            onTap: () {
              AudioBriefingService().upgradeToPremium();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🎉 Upgraded to Dorpon Premium! All content and audio briefing unlocked.'),
                  backgroundColor: Color(0xFF1B2E24),
                  duration: Duration(seconds: 3),
                ),
              );
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [ObsidianTokens.accentGold, Color(0xFFD4A34F)],
                ),
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                boxShadow: [
                  BoxShadow(
                    color: ObsidianTokens.accentGold.withValues(alpha: 0.35),
                    blurRadius: 18,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  _selectedPlanIndex == 0
                      ? 'Subscribe Annually (৳ 799) →'
                      : 'Subscribe Monthly (৳ 99) →',
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Cancel anytime. 7-day money back guarantee.',
            style: TextStyle(color: ObsidianTokens.textTertiary, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitRow(IconData icon, String title, String subtitle, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(color: ObsidianTokens.textSecondary, fontSize: 11, height: 1.35),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
