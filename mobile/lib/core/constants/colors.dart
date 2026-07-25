import 'package:flutter/material.dart';

/// App color palette aligned with the Addisway logo (orange #F26522, blue #2E3192).
abstract class AppColors {
  AppColors._();

  // --- Primary (logo orange/red #F26522) ---
  static const Color primary = Color(0xFF2E3192);
  static const Color primaryLight = Color(0xFF4A4DB8);
  static const Color primaryDark = Color(0xFF22257A);


  // --- Secondary (logo deep blue #2E3192) ---
  static const Color secondary = Color(0xFFF26522);
  static const Color secondaryLight = Color(0xFFF5854A);
  static const Color secondaryDark = Color(0xFFD95618);

  

  // --- Accent (blue tint for highlights) ---
  static const Color accent = Color(0xFF2E3192);
  static const Color accentLight = Color(0xFF4A4DB8);

  // --- CTA accent (vibrant button, e.g. Request delivery) ---
  static const Color ctaAccent = Color(0xFFF26522);
  static const Color ctaAccentLight = Color(0xFFF5854A);
  static const Color textOnCtaAccent = Color(0xFFFFFFFF);

  // --- Background & Surface ---
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF1F5F9);

  // --- Text ---
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textTertiary = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnSecondary = Color(0xFF1E293B);

  // --- Status ---
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // --- Border & Divider ---
  static const Color border = Color(0xFFE2E8F0);
  static const Color divider = Color(0xFFE2E8F0);

  // --- Input ---
  static const Color inputBackground = Color(0xFFF8FAFC);
  static const Color inputBorder = Color(0xFFE2E8F0);
  static const Color inputBorderFocused = Color(0xFFF26522);
}
