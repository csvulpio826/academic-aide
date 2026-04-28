export const Colors = {
  // Backgrounds
  background: '#FFFFFF',
  surfaceLight: '#F8F9FA',
  surfaceMid: '#F0F2F5',
  surfaceDark: '#E8EAED',

  // Primary accent (Instagram-style blue)
  primary: '#007AFF',
  primaryLight: '#E5F1FF',
  primaryDark: '#005BB5',

  // Text
  textPrimary: '#0A0A0A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status colors
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Tab bar
  tabActive: '#007AFF',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',

  // Card
  cardBackground: '#FFFFFF',
  cardShadow: '#000000',

  // Chat
  bubbleOutgoing: '#007AFF',
  bubbleIncoming: '#F0F2F5',
  bubbleTextOutgoing: '#FFFFFF',
  bubbleTextIncoming: '#0A0A0A',

  // Gradient stops
  gradientStart: '#007AFF',
  gradientEnd: '#00C6FF',
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 17,
  fontSizeXL: 20,
  fontSize2XL: 24,
  fontSize3XL: 30,

  fontWeightLight: '300' as const,
  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,

  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  card: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeavy: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  tab: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
};

const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
