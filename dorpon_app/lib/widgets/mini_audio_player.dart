import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';
import '../models/capsule_models.dart';
import '../services/audio_briefing_service.dart';
import '../services/app_settings_service.dart';
import 'audio_player_sheet.dart';
import 'premium_modal.dart';

class MiniAudioPlayer extends StatelessWidget {
  const MiniAudioPlayer({super.key});

  @override
  Widget build(BuildContext context) {
    final audio = AudioBriefingService();
    final settings = AppSettingsService();

    return AnimatedBuilder(
      animation: Listenable.merge([audio, settings]),
      builder: (context, _) {
        if (!audio.isPlayerVisible) {
          return const SizedBox.shrink();
        }

        final chapter = audio.currentChapter;
        final isBangla = settings.isBangla;
        final displayTitle = chapter.getTitle(isBangla);
        final displayCategory = chapter.getCategory(isBangla);
        final displayTime = isBangla
            ? '${toBanglaDigits(audio.formattedPosition)} / ${toBanglaDigits(audio.formattedTotalDuration)}'
            : '${audio.formattedPosition} / ${audio.formattedTotalDuration}';

        return Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 360),
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.5),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: GestureDetector(
                  onTap: () => AudioPlayerSheet.show(context),
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0xE614221D), // Deep obsidian mint glass
                      borderRadius: BorderRadius.circular(ObsidianTokens.radiusTile),
                      border: Border.all(
                        color: ObsidianTokens.primaryMint.withValues(alpha: 0.25),
                        width: 1,
                      ),
                    ),
                    child: Stack(
                      children: [
                        // Main Content
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: [
                              // Equalizer / Disc Icon
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: ObsidianTokens.primaryMint.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  audio.isPlaying ? Icons.graphic_eq_rounded : Icons.headphones_rounded,
                                  color: ObsidianTokens.primaryMint,
                                  size: 18,
                                ),
                              ),
                              const SizedBox(width: 10),

                              // Chapter Title & Time
                              Expanded(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      displayTitle,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      '$displayTime • $displayCategory',
                                      style: ObsidianTokens.labelXs(color: ObsidianTokens.textSecondary),
                                    ),
                                  ],
                                ),
                              ),

                              // Play / Pause / Upgrade Button
                              GestureDetector(
                                onTap: () {
                                  if (audio.hasHitFreeLimit && !audio.isPremiumUser) {
                                    PremiumModal.show(
                                      context,
                                      title: 'Daily Free 1m Limit Reached',
                                      subtitle: 'Upgrade to Dorpon Premium to continue listening to the full audio briefing.',
                                      icon: Icons.headphones_rounded,
                                    );
                                  } else {
                                    audio.togglePlay();
                                  }
                                },
                                child: Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    color: audio.hasHitFreeLimit && !audio.isPremiumUser
                                        ? ObsidianTokens.accentGold
                                        : ObsidianTokens.primaryMint,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    audio.hasHitFreeLimit && !audio.isPremiumUser
                                        ? Icons.lock_outline_rounded
                                        : (audio.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                                    color: Colors.black,
                                    size: 19,
                                  ),
                                ),
                              ),

                              const SizedBox(width: 6),

                              // Dismiss Button
                              GestureDetector(
                                onTap: audio.closePlayer,
                                child: Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.05),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close_rounded,
                                    color: Colors.white60,
                                    size: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Bottom Linear Progress Line
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              return Align(
                                alignment: Alignment.centerLeft,
                                child: Container(
                                  height: 2,
                                  width: constraints.maxWidth * audio.progressRatio,
                                  decoration: BoxDecoration(
                                    color: ObsidianTokens.primaryMint,
                                    borderRadius: BorderRadius.circular(1),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
