import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/obsidian_tokens.dart';

class FloatingDock extends StatelessWidget {
  final int activeIndex;
  final Function(int) onTabSelected;

  const FloatingDock({
    super.key,
    required this.activeIndex,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 360),
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.65),
              blurRadius: 40,
              spreadRadius: 2,
              offset: const Offset(0, 20),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              height: 58,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0x992B4239), // secondary-container/55
                borderRadius: BorderRadius.circular(ObsidianTokens.radiusPill),
                border: Border.all(
                  color: Colors.white.withOpacity(0.12),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // 1. Discover (Page 0)
                  _buildIconItem(
                    index: 0,
                    unselectedIcon: Icons.explore_outlined,
                    selectedIcon: Icons.explore,
                    semanticLabel: 'Discover',
                  ),

                  // 2. Top Stories / Read (Page 1 - Center)
                  _buildIconItem(
                    index: 1,
                    unselectedIcon: Icons.home_outlined,
                    selectedIcon: Icons.home,
                    semanticLabel: 'Top Stories',
                  ),

                  // 3. Current Affairs Deep Dives (Page 2 - Right)
                  _buildIconItem(
                    index: 2,
                    unselectedIcon: Icons.auto_awesome_outlined,
                    selectedIcon: Icons.auto_awesome_rounded,
                    semanticLabel: 'Current Affairs',
                    isGold: true,
                  ),

                  // 4. Saved Revision Binder (Page 3)
                  _buildIconItem(
                    index: 3,
                    unselectedIcon: Icons.bookmark_outline,
                    selectedIcon: Icons.bookmark,
                    semanticLabel: 'Saved',
                  ),

                  // 5. Profile on the Rightmost slot (Page 4)
                  _buildIconItem(
                    index: 4,
                    unselectedIcon: Icons.person_outline,
                    selectedIcon: Icons.person,
                    semanticLabel: 'Profile',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconItem({
    required int index,
    required IconData unselectedIcon,
    required IconData selectedIcon,
    required String semanticLabel,
    bool isGold = false,
  }) {
    final isSelected = activeIndex == index;
    final activeColor = isGold ? ObsidianTokens.accentGold : ObsidianTokens.primaryMint;

    return Semantics(
      label: semanticLabel,
      button: true,
      selected: isSelected,
      child: GestureDetector(
        onTap: () => onTabSelected(index),
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.08 : 1.0,
                duration: const Duration(milliseconds: 150),
                child: Icon(
                  isSelected ? selectedIcon : unselectedIcon,
                  color: isSelected
                      ? activeColor
                      : ObsidianTokens.textSecondary.withOpacity(0.65),
                  size: 22,
                ),
              ),
              const SizedBox(height: 3),
              // Tiny 4px glowing dot indicator matching Stitch "after:w-1 after:h-1 after:bg-primary"
              if (isSelected)
                Container(
                  width: 4,
                  height: 4,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: activeColor,
                    boxShadow: [
                      BoxShadow(
                        color: activeColor.withOpacity(0.6),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                )
              else
                const SizedBox(height: 4),
            ],
          ),
        ),
      ),
    );
  }
}
