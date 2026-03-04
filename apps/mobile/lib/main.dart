import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/database_service.dart';
import 'services/auth_service.dart';
import 'services/document_service.dart';
import 'services/connectivity_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  bool isConfigValid = false;
  try {
    await dotenv.load(fileName: '.env');
    final url = dotenv.env['SUPABASE_URL'] ?? '';
    final anonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
    
    if (url.isNotEmpty && anonKey.isNotEmpty) {
      await Supabase.initialize(
        url: url,
        anonKey: anonKey,
      );
      isConfigValid = true;
    }
  } catch (e) {
    debugPrint('Startup Configuration Error: $e');
  }

  final dbService = DatabaseService();
  try {
    await dbService.init();
  } catch (e) {
    debugPrint('Error initializing Database: $e');
  }

  // Prevent Google Fonts from trying to download fonts at runtime
  // This avoids crashes when there's no/slow network on first launch
  GoogleFonts.config.allowRuntimeFetching = false;

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider<DatabaseService>.value(value: dbService),
        Provider<DocumentService>(create: (_) => DocumentService()),
        ChangeNotifierProxyProvider2<DatabaseService, AuthService, ConnectivityService>(
          create: (ctx) => ConnectivityService(
            ctx.read<DatabaseService>(),
            ctx.read<AuthService>(),
          ),
          update: (_, db, auth, prev) => prev ?? ConnectivityService(db, auth),
        ),
      ],
      child: SmartBizApp(isConfigValid: isConfigValid),
    ),
  );
}

class SmartBizApp extends StatefulWidget {
  final bool isConfigValid;
  const SmartBizApp({super.key, required this.isConfigValid});

  @override
  State<SmartBizApp> createState() => _SmartBizAppState();
}

class _SmartBizAppState extends State<SmartBizApp> {
  bool _showSplash = true;

  @override
  Widget build(BuildContext context) {
    if (!widget.isConfigValid) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorSchemeSeed: const Color(0xFFEF4444),
        ),
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Color(0xFFEF4444)),
                  const SizedBox(height: 24),
                  const Text(
                    'Configuration Error',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'The application configuration (.env) is missing or invalid. Please check your setup and try again.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () {
                      // Attempt to reload or exit
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      title: 'SmartBiz GO',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF2563EB),
        brightness: Brightness.light,
        textTheme: GoogleFonts.interTextTheme(),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.grey.shade50,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade100),
          ),
        ),
      ),
      home: _showSplash 
        ? SplashScreen(onComplete: () => setState(() => _showSplash = false))
        : Consumer<AuthService>(
            builder: (context, auth, _) {
              if (auth.isAuthenticated) {
                return const HomeShell();
              }
              return const LoginScreen();
            },
          ),
    );
  }
}
