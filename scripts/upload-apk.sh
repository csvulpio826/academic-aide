#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Upload APK to Firebase App Distribution
# Usage: ./scripts/upload-apk.sh <path-to-apk.apk> [release_notes]
# ──────────────────────────────────────────────────────────────────────────────

set -e

APK_PATH="$1"
RELEASE_NOTES="${2:-Beta build $(date '+%Y-%m-%d %H:%M')}"
FIREBASE_APP_ID="1:861423624712:android:3b9c133e29ee95dee3e7bd"
TESTER_GROUPS="beta-testers"

if [ -z "$APK_PATH" ]; then
  echo "Usage: ./scripts/upload-apk.sh <path-to-apk.apk> [release_notes]"
  exit 1
fi

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK not found: $APK_PATH"
  exit 1
fi

echo "🚀 Uploading APK to Firebase App Distribution..."
echo "   App: $FIREBASE_APP_ID"
echo "   Testers: $TESTER_GROUPS"
echo "   Notes: $RELEASE_NOTES"
echo ""

firebase appdistribution:distribute "$APK_PATH" \
  --app "$FIREBASE_APP_ID" \
  --groups "$TESTER_GROUPS" \
  --release-notes "$RELEASE_NOTES"

echo ""
echo "✅ Done! Testers in '$TESTER_GROUPS' will receive an email with a download link."
