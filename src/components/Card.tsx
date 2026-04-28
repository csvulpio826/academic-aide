import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  heavy?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, heavy = false }) => {
  return (
    <View style={[styles.card, heavy ? styles.heavy : styles.normal, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  normal: {
    ...Shadows.card,
  },
  heavy: {
    ...Shadows.cardHeavy,
  },
});
