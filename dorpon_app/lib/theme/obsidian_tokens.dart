import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ObsidianTokens {
  // Brand Backgrounds
  static const Color background = Color(0xFF0A0E0D);
  static const Color surfaceContainerLowest = Color(0xFF0B0F0E);
  static const Color ambientGlow = Color(0xFF11261F);
  
  // Translucent Glass Surfaces
  static const Color surfaceGlass = Color(0x0AFFFFFF); // rgba(255, 255, 255, 0.04)
  static const Color surfaceGlassBorder = Color(0x12FFFFFF); // rgba(255, 255, 255, 0.07)
  static const Color surfaceGlassActive = Color(0x14FFFFFF); // rgba(255, 255, 255, 0.08)
  
  // Accents
  static const Color primaryMint = Color(0xFF34D399); // Soft mint/emerald
  static const Color primaryBright = Color(0xFF5AF0B3);
  static const Color accentGold = Color(0xFFEAB308); // BCS Pro Gold
  static const Color darkPill = Color(0xFF181C1B);
  
  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF8E9F97); // Muted Sage
  static const Color textTertiary = Color(0x808E9F97);
  
  // Surfaces & Containers
  static const Color surfaceContainerHigh = Color(0xFF272B2A);
  static const Color surfaceContainer = Color(0xFF1C201F);
  
  // Shapes & Radii
  static const double radiusCard = 28.0;
  static const double radiusTile = 20.0;
  static const double radiusLg = 24.0;
  static const double radiusMd = 16.0;
  static const double radiusPill = 9999.0;
  
  // Text Styles (Plus Jakarta Sans)
  static TextStyle headlineXl({Color color = textPrimary}) => GoogleFonts.plusJakartaSans(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.8,
    color: color,
  );
  
  static TextStyle headlineLg({Color color = textPrimary}) => GoogleFonts.plusJakartaSans(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.5,
    color: color,
  );
  
  static TextStyle headlineMd({Color color = textPrimary}) => GoogleFonts.plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
    color: color,
  );

  static TextStyle headlineSm({Color color = textPrimary}) => GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    color: color,
  );
  
  static TextStyle bodyLg({Color color = textPrimary}) => GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.55,
    color: color,
  );
  
  static TextStyle bodyMd({Color color = textSecondary}) => GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: color,
  );

  static TextStyle bodySm({Color color = textSecondary}) => GoogleFonts.plusJakartaSans(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.45,
    color: color,
  );
  
  static TextStyle labelSm({Color color = textSecondary}) => GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.2,
    color: color,
  );
  
  static TextStyle labelXs({Color color = textSecondary}) => GoogleFonts.plusJakartaSans(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: color,
  );
}
