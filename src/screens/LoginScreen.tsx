import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows } from '../theme';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../firebase';
// GoogleSignin requires a native dev build — not available in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  statusCodes = gsModule.statusCodes;
} catch {
  // Running in Expo Go — Google Sign-In unavailable
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [googleSignInReady, setGoogleSignInReady] = useState(false);

  useEffect(() => {
    // Initialize Google Sign-In
    const initGoogleSignIn = async () => {
      if (!GoogleSignin) {
        // Expo Go — skip silently
        return;
      }
      try {
        await GoogleSignin.configure({
          webClientId: '861423624712-h4n2q4p8r5d7j3k9l2m4n6p8q0s2t4v6.apps.googleusercontent.com', // From google-services.json
          offlineAccess: false,
          hostedDomain: undefined,
          forceCodeForRefreshToken: true,
        });
        setGoogleSignInReady(true);
      } catch (err: any) {
        console.error('[LoginScreen] GoogleSignin config error:', err);
        // Don't show alert — let users still use guest sign-in
      }
    };

    initGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin || !googleSignInReady) {
      Alert.alert(
        'Google Sign-In Not Available',
        'Use "Continue as Guest" to test in Expo Go. Google Sign-In requires a full dev build.',
        [{ text: 'OK' }],
      );
      return;
    }

    setLoading(true);
    try {
      // Check if user has Google Play Services
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Get the Google ID token
      const { idToken } = userInfo;
      if (!idToken) {
        throw new Error('No ID token from Google Sign-In');
      }

      // Create Firebase credential and sign in
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — don't show alert
      } else if (err.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign-In in Progress', 'Please wait...');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Play Services Not Available',
          'Please install/update Google Play Services.',
          [{ text: 'OK' }],
        );
      } else {
        console.error('[LoginScreen] Google Sign-In error:', err);
        Alert.alert('Sign-In Error', err.message || 'Unable to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top illustration area */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>Academic Aide</Text>
        <Text style={styles.tagline}>Your personal study companion</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {[
          { icon: 'calendar-outline', text: 'Track classes & deadlines' },
          { icon: 'stats-chart-outline', text: 'Monitor your grades' },
          { icon: 'chatbubble-outline', text: 'AI-powered study help' },
          { icon: 'book-outline', text: 'Find textbooks instantly' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={20} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.googleBtn, Shadows.card]}
          onPress={handleGoogleSignIn}
          onLongPress={() =>
            Alert.alert('Info', googleSignInReady ? 'Ready' : 'Dev build required')
          }
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleBtnText}>
                {googleSignInReady ? 'Continue with Google' : 'Continue with Google (Dev Build)'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleGuestSignIn}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800' as any,
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500' as any,
  },
  features: {
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500' as any,
  },
  buttons: {
    paddingBottom: 16,
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: Colors.textPrimary,
  },
  guestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
  },
  guestBtnText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#fff',
  },
  terms: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
