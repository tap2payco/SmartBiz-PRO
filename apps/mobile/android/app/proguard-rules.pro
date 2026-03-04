# Flutter/Dart
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Supabase / GoTrue / Realtime
-keep class io.supabase.** { *; }
-keep class com.google.crypto.** { *; }
-dontwarn com.google.crypto.**

# sqflite
-keep class com.tekartik.sqflite.** { *; }

# Google Fonts
-keep class com.google.android.gms.** { *; }

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**

# General Android
-keep class androidx.** { *; }
-dontwarn androidx.**

# Prevent R8 from stripping interfaces used by Dart FFI
-keep class * implements flutter.plugin.common.MethodChannel$MethodCallHandler { *; }
