import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart';
import 'theme/obsidian_tokens.dart';
import 'screens/home_screen.dart';
import 'services/app_settings_service.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
    );
  } catch (e) {
    debugPrint('Firebase initialization note: $e');
  }

  // Initialize App Settings & Auth State
  await AppSettingsService().init();
  await AuthService().init();

  runApp(const DorponApp());
}

class DorponApp extends StatelessWidget {
  const DorponApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsService();

    return AnimatedBuilder(
      animation: settings,
      builder: (context, _) {
        String? activeFontFamily;
        if (settings.isBangla) {
          activeFontFamily = GoogleFonts.hindSiliguri().fontFamily;
        } else if (settings.isSerif) {
          activeFontFamily = GoogleFonts.sourceSerif4().fontFamily;
        } else {
          activeFontFamily = GoogleFonts.plusJakartaSans().fontFamily;
        }

        return MaterialApp(
          title: settings.tr('app_name'),
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: ObsidianTokens.background,
            colorScheme: const ColorScheme.dark(
              primary: ObsidianTokens.primaryMint,
              surface: ObsidianTokens.background,
            ),
            fontFamily: activeFontFamily,
          ),
          home: const HomeScreen(),
        );
      },
    );
  }
}
