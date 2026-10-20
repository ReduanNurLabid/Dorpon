import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../services/audio_briefing_service.dart';
import 'premium_modal.dart';

class AudioPlayerSheet extends StatelessWidget {
  const AudioPlayerSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AudioPlayerSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final audio = AudioBriefingService();

    return AnimatedBuilder(
      animation: audio,
      builder: (context, _) {
        final chapter = audio.currentChapter;

        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.88,
            decoration: BoxDecoration(
              color: const Color(0xFF0D1412).withValues(alpha: 0.94),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.08),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                // 1. Drag Handle
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

                // 2. Top Bar (Close + Mode)
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
                          child: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 24),
                        ),
                      ),
                      Column(
                        children: [
                          Text(
                            'NOW PLAYING',
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.primaryMint).copyWith(
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Today\'s Audio Briefing',
                            style: ObsidianTokens.labelSm(color: Colors.white70),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: audio.toggleLanguage,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: ObsidianTokens.primaryMint.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            border: Border.all(color: ObsidianTokens.primaryMint.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            audio.language == 'en' ? 'EN Voice' : 'বাংলা কণ্ঠ',
                            style: const TextStyle(
                              color: ObsidianTokens.primaryMint,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 3. Scrollable Content Area (Album art, scrubber, controls, chapters)
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    physics: const BouncingScrollPhysics(),
                    children: [
                      const SizedBox(height: 10),

                      // Hero Vinyl / Audio Aura Graphic
                      Center(
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                ObsidianTokens.primaryMint.withValues(alpha: 0.25),
                                ObsidianTokens.primaryMint.withValues(alpha: 0.05),
                                Colors.transparent,
                              ],
                              stops: const [0.3, 0.7, 1.0],
                            ),
                          ),
                          child: Center(
                            child: Container(
                              width: 140,
                              height: 140,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF14201C),
                                border: Border.all(
                                  color: audio.isPlaying
                                      ? ObsidianTokens.primaryMint
                                      : Colors.white.withValues(alpha: 0.15),
                                  width: 2,
                                ),
                                boxShadow: [
                                  if (audio.isPlaying)
                                    BoxShadow(
                                      color: ObsidianTokens.primaryMint.withValues(alpha: 0.3),
                                      blurRadius: 30,
                                      spreadRadius: 4,
                                    ),
                                ],
                              ),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      audio.isPlaying ? Icons.graphic_eq_rounded : Icons.headphones_rounded,
                                      color: ObsidianTokens.primaryMint,
                                      size: 38,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Dorpon Daily',
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.8),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Chapter Counter & Category Pill
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: audio.isTransitioning
                                ? ObsidianTokens.accentGold.withValues(alpha: 0.16)
                                : Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                            border: audio.isTransitioning
                                ? Border.all(color: ObsidianTokens.accentGold.withValues(alpha: 0.4))
                                : null,
                          ),
                          child: Text(
                            audio.isTransitioning
                                ? '♪ TRANSITION CHIME • UP NEXT: CHAPTER ${audio.activeChapterIndex + 2}'
                                : 'CHAPTER ${audio.activeChapterIndex + 1} OF ${audio.chapters.length} • ${chapter.category}',
                            style: ObsidianTokens.labelXs(
                              color: audio.isTransitioning ? ObsidianTokens.accentGold : ObsidianTokens.primaryMint,
                            ).copyWith(
                              letterSpacing: 0.8,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Headline
                      Text(
                        audio.isTransitioning ? 'Smooth Interlude & Next Story Setup...' : chapter.title,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: audio.isTransitioning ? ObsidianTokens.accentGold : Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          height: 1.35,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      const SizedBox(height: 24),

                      // 4. Scrubber Slider
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          trackHeight: 4,
                          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                          overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                          activeTrackColor: ObsidianTokens.primaryMint,
                          inactiveTrackColor: Colors.white.withValues(alpha: 0.1),
                          thumbColor: Colors.white,
                          overlayColor: ObsidianTokens.primaryMint.withValues(alpha: 0.2),
                        ),
                        child: Slider(
                          value: audio.progressRatio,
                          onChanged: (val) {
                            audio.seekRatio(val);
                          },
                        ),
                      ),

                      // Timestamps & Free Tier Limit Tag
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              audio.formattedPosition,
                              style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                            ),
                            if (!audio.isPremiumUser)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: audio.hasHitFreeLimit
                                      ? ObsidianTokens.accentGold.withValues(alpha: 0.2)
                                      : Colors.white.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: audio.hasHitFreeLimit
                                        ? ObsidianTokens.accentGold
                                        : Colors.white.withValues(alpha: 0.1),
                                  ),
                                ),
                                child: Text(
                                  audio.hasHitFreeLimit ? 'Daily Free 1m Limit Reached' : 'Free Preview: 1m limit',
                                  style: TextStyle(
                                    color: audio.hasHitFreeLimit ? ObsidianTokens.accentGold : Colors.white70,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            Text(
                              '-${audio.formattedRemainingTime}',
                              style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                            ),
                          ],
                        ),
                      ),

                      // Premium Paywall Alert Card when 1 min free listening is hit
                      if (audio.hasHitFreeLimit && !audio.isPremiumUser) ...[
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: () {
                            PremiumModal.show(
                              context,
                              title: 'Enjoyed the Audio Briefing?',
                              subtitle: 'Your free daily 1-minute audio preview is complete. Upgrade to Premium for unlimited hands-free morning dispatches.',
                              ctaText: 'Unlock Unlimited Audio • ৳ 99/mo',
                              icon: Icons.headphones_rounded,
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  ObsidianTokens.accentGold.withValues(alpha: 0.18),
                                  ObsidianTokens.accentGold.withValues(alpha: 0.06),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusCard),
                              border: Border.all(color: ObsidianTokens.accentGold.withValues(alpha: 0.5)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.workspace_premium, color: ObsidianTokens.accentGold, size: 22),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Daily Free 1-Min Audio Complete',
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Unlock full uninterrupted listening across all chapters.',
                                        style: TextStyle(color: ObsidianTokens.textSecondary, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: ObsidianTokens.accentGold,
                                    borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                                  ),
                                  child: const Text(
                                    'Upgrade',
                                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 20),

                      // 5. Playback Controls Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Speed Toggle Button
                          GestureDetector(
                            onTap: audio.cyclePlaybackSpeed,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                              ),
                              child: Text(
                                '${audio.playbackSpeed}x',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),

                          // Rewind 10s
                          IconButton(
                            icon: const Icon(Icons.replay_10_rounded, color: Colors.white, size: 28),
                            onPressed: () => audio.skipSeconds(-10),
                          ),

                          // Previous Chapter
                          IconButton(
                            icon: const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 32),
                            onPressed: audio.previousChapter,
                          ),

                          // Central Play/Pause Button
                          GestureDetector(
                            onTap: audio.togglePlay,
                            child: Container(
                              width: 68,
                              height: 68,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: ObsidianTokens.primaryMint,
                                boxShadow: [
                                  BoxShadow(
                                    color: ObsidianTokens.primaryMint.withValues(alpha: 0.45),
                                    blurRadius: 20,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Icon(
                                audio.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                color: Colors.black,
                                size: 36,
                              ),
                            ),
                          ),

                          // Next Chapter
                          IconButton(
                            icon: const Icon(Icons.skip_next_rounded, color: Colors.white, size: 32),
                            onPressed: audio.nextChapter,
                          ),

                          // Forward 10s
                          IconButton(
                            icon: const Icon(Icons.forward_10_rounded, color: Colors.white, size: 28),
                            onPressed: () => audio.skipSeconds(10),
                          ),
                        ],
                      ),

                      const SizedBox(height: 28),

                      // 6. Chapter Breakdown Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'EDITION CHAPTERS',
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary).copyWith(
                              letterSpacing: 1.0,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${audio.chapters.length} Stories',
                            style: ObsidianTokens.labelXs(color: ObsidianTokens.textTertiary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Chapter List
                      ...audio.chapters.asMap().entries.map((entry) {
                        final index = entry.key;
                        final ch = entry.value;
                        final isActive = index == audio.activeChapterIndex;

                        return GestureDetector(
                          onTap: () => audio.jumpToChapter(index),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? ObsidianTokens.primaryMint.withValues(alpha: 0.12)
                                  : Colors.white.withValues(alpha: 0.03),
                              borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                              border: Border.all(
                                color: isActive
                                    ? ObsidianTokens.primaryMint.withValues(alpha: 0.3)
                                    : Colors.white.withValues(alpha: 0.05),
                              ),
                            ),
                            child: Row(
                              children: [
                                if (isActive)
                                  const Icon(Icons.volume_up_rounded, color: ObsidianTokens.primaryMint, size: 16)
                                else
                                  Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      color: ObsidianTokens.textTertiary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        ch.title,
                                        style: TextStyle(
                                          color: isActive ? Colors.white : ObsidianTokens.textSecondary,
                                          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                                          fontSize: 13,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        ch.category,
                                        style: TextStyle(
                                          color: isActive ? ObsidianTokens.primaryMint : ObsidianTokens.textTertiary,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  _formatDuration(ch.startTime),
                                  style: TextStyle(
                                    color: isActive ? ObsidianTokens.primaryMint : ObsidianTokens.textTertiary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
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

  static String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
