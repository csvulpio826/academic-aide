#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Academic Aide — Firebase App Distribution Script
# Usage: ./scripts/distribute.sh [release_notes]
# ──────────────────────────────────────────────────────────────────────────────

set -e

FIREBASE_APP_ID="1:861423624712:android:3b9c133e29ee95dee3e7bd"
TESTER_GROUPS="beta-testers"
RELEASE_NOTES="${1:-Beta build $(date '+%Y-%m-%d %H:%M')}"

echo "📱 Academic Aide — Firebase App Distribution"
echo "============================================"
echo ""

# Step 1: Check firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "❌ Firebase CLI not found. Installing..."
  npm install -g firebase-tools
fi

# Step 2: Build APK via EAS
echo "🔨 Building APK with EAS..."
echo "   (This will prompt for Expo login if not already logged in)"
echo ""
npx eas build --platform android --profile preview --non-interactive --no-wait

echo ""
echo "⏳ Build submitted to EAS. Once complete, download the APK and run:"
echo ""
echo "   firebase appdistribution:distribute <path-to-apk.apk> \\"
echo "     --app $FIREBASE_APP_ID \\"
echo "     --groups $TESTER_GROUPS \\"
echo "     --release-notes \"$RELEASE_NOTES\""
echo ""
echo "📋 Or use the manual upload script below for a local APK:"
