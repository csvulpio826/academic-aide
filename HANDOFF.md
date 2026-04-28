# Academic Aide - Complete Project Handoff

## Overview
Academic Aide is a mobile app for students built with React Native (Expo SDK 54), TypeScript, and Firebase. Instagram-inspired UI with clean white/light theme and blue accents.

## Tech Stack
- React Native 0.81.5 + Expo SDK 54
- TypeScript 5.9
- Firebase (Auth, Firestore, Storage, Cloud Functions)
- React Navigation (Bottom Tabs)
- Anthropic Claude Haiku 4.5 (primary AI) + GLM-4-Flash (free fallback)

## Firebase Config
- Project ID: academic-aide
- App ID (Android): 1:861423624712:android:3b9c133e29ee95dee3e7bd
- Package: com.academicaide.app
- Auth: Anonymous + Google Sign-In
- Firestore: users/{uid}/grades, users/{uid}/schedule, users/{uid}/textbooks, users/{uid}/profile/settings, token_usage/{date}, studyGroups/{id}/notes
- Storage: users/{uid}/textbooks/{filename}.pdf

## AI Provider Architecture
- Primary: GLM-4-Flash (free, fast, default)
- Backup: Claude Haiku 4.5 (auto-fallback if GLM fails)
- User can toggle provider in chat header
- Daily token cap: 125K tokens tracked in Firestore
- System prompt enforces plain text only (no markdown)

## App Structure (5 Bottom Tabs)
1. Home - Dashboard with live GPA, deadlines, recent grades, study tips
2. Chat - AI chat with textbook detection, PDF upload, quick replies
3. Schedule - Day/Week/Month views with Firestore events
4. Grades - GPA summary, course grades, add/delete grades
5. Write - Writing assistant with 4 modes (Essay, Grammar, Outline, Citation)

## Additional Screens (not in tabs)
- LoginScreen - Google Sign-In + Guest (anonymous auth)
- QuizScreen - AI-generated quizzes with topic/difficulty/count selection
- CollabScreen - Study groups with shared notes
- ProfileScreen - User profile, settings, achievements

## Key Features Built
- Real-time Firestore sync for all data (grades, schedule, textbooks, profile)
- Textbook auto-detection in chat (6 trigger phrases -> Google Books search)
- PDF upload to Firebase Storage with client-side text extraction
- PDF passed to Claude as document block for full analysis
- Textbook library with persistent storage and re-download
- AI provider auto-switching with user notification
- Deadline notification scheduling (expo-notifications)
- GPA auto-calculation from grades
- Schedule with Day/Week/Month views and event detail modals
- Writing assistant with 4 analysis modes
- Quiz generation with scoring and explanations
- Study groups with shared notes (Firestore real-time)
- Profile editing with Firestore persistence

## File Structure
```
projects/academic-aide/
  App.tsx              # Root app (AuthProvider + TabNavigator + notifications)
  app.json             # Expo config + Anthropic API key
  package.json         # Dependencies
  functions/index.js   # Cloud Functions (PDF processing, chunk search)
  src/
    firebase.ts        # Firebase init
    theme.ts           # Colors, typography, spacing, shadows
    types/index.ts     # TypeScript interfaces
    context/
      AuthContext.tsx   # Firebase auth provider
    services/
      aiService.ts     # Claude + GLM chat, token tracking
      textbookService.ts  # Google Books, Firestore chunks
      pdfService.ts    # Client-side PDF text extraction
      notificationService.ts  # Expo notifications
    hooks/
      useGrades.ts     # Firestore grades CRUD
      useSchedule.ts   # Firestore schedule CRUD
      useProfile.ts    # Firestore profile read/write
      useTextbooks.ts  # Firestore textbook library
      useCollaboration.ts  # Study groups + notes
    screens/
      HomeScreen.tsx
      ChatScreen.tsx
      ScheduleScreen.tsx
      GradesScreen.tsx
      LoginScreen.tsx
      WritingScreen.tsx
      QuizScreen.tsx
      CollabScreen.tsx
      ProfileScreen.tsx
    components/
      Card.tsx, Badge.tsx, Avatar.tsx, SectionHeader.tsx
      AddGradeModal.tsx, AddEventModal.tsx, AddTextbookModal.tsx
      EditProfileModal.tsx, ProfileModal.tsx
      AttachmentMenu.tsx, TextbookLibraryPicker.tsx
    navigation/
      TabNavigator.tsx  # Active 5-tab navigator
      BottomTabNavigator.tsx  # Legacy (unused)
```

## Design System
- Primary: #0095F6 (Instagram blue)
- Background: #FFFFFF
- Text: #0A0A0A (primary), #6B7280 (secondary), #9CA3AF (muted)
- Success: #22C55E, Warning: #F59E0B, Danger: #EF4444
- Card shadows, consistent border radius, spacing scale

## Known Issues / Incomplete
- Cloud Functions not deployed (PDF processing works client-side as fallback)
- Google Sign-In only works in dev builds (not Expo Go)
- ProfileScreen uses legacy theme imports (@/ alias)
- Two App.tsx files exist (App.tsx is active, app.tsx is legacy)
- Distribution not set up (eas.json exists but no builds published)
- Expo Go limitations: notifications, Google Sign-In unavailable

## Next Steps (from last session)
- Wire Claude API more deeply into Chat
- Deploy Cloud Functions for server-side PDF processing
- Set up Firebase App Distribution for 10 beta testers
- Google Calendar sync
- Dark mode support
