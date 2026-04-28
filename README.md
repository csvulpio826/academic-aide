# Academic Aide

An Instagram-style React Native mobile app for students to manage their academic life. Built with Expo, TypeScript, and React Navigation.

## Features

- 📱 **5-Tab Navigation**: Home, Chat, Schedule, Grades, Profile
- 🎨 **Clean UI Design**: Instagram-inspired, minimal white/light theme with blue accents
- 📊 **Grade Tracking**: View GPA, per-class grades, and progress toward targets
- 📅 **Schedule Management**: Calendar view with classes, exams, and deadlines
- 💬 **AI Chat Assistant**: Ask questions about courses and get study advice
- 🏆 **Achievements**: Unlock badges for academic milestones
- ⚙️ **Profile & Settings**: Manage student profile, notifications, and preferences

## Project Structure

```
academic-aide/
├── app.tsx                 # Root app component with navigation setup
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── .gitignore              # Git ignore rules
├── index.ts                # Entry point
├── src/
│   ├── screens/            # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── GradesScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── index.ts
│   ├── components/         # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── GradeCard.tsx
│   │   ├── DeadlineCard.tsx
│   │   └── index.ts
│   ├── navigation/         # Navigation config
│   │   ├── BottomTabNavigator.tsx
│   │   └── index.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Helper functions
│   │   ├── dateUtils.ts
│   │   ├── gradeUtils.ts
│   │   └── index.ts
│   └── theme.ts            # Color, spacing, typography
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to the project:
```bash
cd academic-aide
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go or press `i` (iOS) or `a` (Android)

### Development Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Open iOS simulator
- `npm run android` - Open Android emulator
- `npm run web` - Run on web
- `npm run lint` - Type-check with TypeScript
- `npm run type-check` - Full type checking

## Design System

### Colors

- **Primary**: #0A66C2 (LinkedIn-inspired blue)
- **Background**: #FAFAFA (Light gray)
- **Card**: #FFFFFF (White)
- **Text**: #000000, #65676B, #A0A0A0 (Primary, Secondary, Tertiary)
- **Status**: #31A24C (Success), #F02849 (Warning), #E0245E (Error)

### Spacing

- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- xxl: 24px
- xxxl: 32px

### Typography

- Font sizes: 12px - 32px (xs to 4xl)
- Font weights: 300 (light) - 700 (bold)
- Line heights: 1.2 (tight) - 1.75 (relaxed)

### Components

#### Card
A basic card container with shadow, border, and rounded corners.

```tsx
<Card>
  <Text>Content here</Text>
</Card>
```

#### MessageBubble
Chat message bubble with user/assistant styling.

```tsx
<MessageBubble
  text="Hello!"
  isUser={true}
  timestamp="2:30 PM"
/>
```

#### GradeCard
Displays a class grade with current, target, and progress.

```tsx
<GradeCard
  className="Calculus II"
  current={88}
  target={90}
/>
```

#### DeadlineCard
Shows an upcoming deadline with priority indicator.

```tsx
<DeadlineCard
  title="Math Assignment"
  className="MATH 201"
  daysUntil={3}
  priority="high"
/>
```

## Screens

### Home
- GPA circle display
- Upcoming deadlines
- Study tips with icons
- This week stats (classes, completed, pending)

### Chat
- Conversational UI with message bubbles
- Auto-scrolling chat area
- Input field with send button
- Simulated AI responses

### Schedule
- Mini calendar view
- Day selector (Today, Tomorrow, This Week)
- Class/exam/deadline list with details
- Time and location information

### Grades
- Current GPA vs target
- Average grade display
- GPA progress bar
- Per-class grade cards with progress
- Grade distribution summary
- Focus areas with study resources

### Profile
- Student avatar and info
- Quick stats (GPA, courses, tasks)
- Achievements/badges grid
- Settings with toggles
- Contact information
- Logout and delete account options

## Customization

### Colors
Edit `src/theme.ts` to change the color scheme:

```typescript
export const colors = {
  primary: '#0A66C2',
  // ... more colors
};
```

### Add a New Screen
1. Create `src/screens/NewScreen.tsx`
2. Add to `src/screens/index.ts`
3. Add to `src/navigation/BottomTabNavigator.tsx`
4. Update `NavigationTabParamList` in `src/types/index.ts`

### Add a New Component
1. Create `src/components/NewComponent.tsx`
2. Export in `src/components/index.ts`
3. Use in screens

## Utilities

### Date Utils
- `formatDate(date)` - Format as "Mon, Apr 3"
- `formatTime(date)` - Format as "2:30 PM"
- `getDaysUntil(date)` - Calculate days remaining
- `isOverdue(date)` - Check if past due
- `isDueToday(date)` - Check if due today
- `isDueSoon(date, days)` - Check if within N days

### Grade Utils
- `calculateGPA(grades, weights)` - Calculate weighted GPA
- `getGradeLetterFromPercentage(pct)` - Get A/B/C/D/F
- `getGradeColor(grade)` - Get color object for grade
- `calculateNeededGrade(current, target, weight)` - Grade needed
- `isPassingGrade(grade, passingGrade)` - Check if passing

## API Integration

To connect to a real backend:

1. Update types in `src/types/index.ts`
2. Create API service in `src/utils/api.ts`
3. Use hooks (e.g., `useEffect`) to fetch data
4. Replace mock data with real API calls

Example:
```typescript
// src/utils/api.ts
export const getGrades = async (studentId: string) => {
  const response = await fetch(`/api/grades/${studentId}`);
  return response.json();
};
```

## Build & Deploy

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Troubleshooting

### Module not found errors
- Clear cache: `npm start -- --clear`
- Reinstall: `rm -rf node_modules && npm install`

### TypeScript errors
- Check `tsconfig.json` paths match your imports
- Run `npm run type-check` for full diagnostics

### Styles not applying
- Ensure you're importing from `@/theme`
- Check StatusBar settings for header issues

## Performance Tips

- Use `React.memo` for frequently-rendered components
- Implement pagination for long lists
- Lazy-load images with `react-native-fast-image`
- Use `FlatList` instead of `ScrollView` for large lists

## Deployment & Architecture Updates (April 25, 2026)

- Transitioned backend architecture: Deployed server-side Firebase Cloud Functions (`processPdfUpload`, `searchTextbookChunks`) to handle heavy PDF extraction and chunking, preventing mobile client crashes.
- Resolved Firebase authentication and API issues: Upgraded to Blaze plan, enabled Cloud Functions/Build/ArtifactRegistry APIs, and manually configured `gs-project-accounts` IAM permissions to allow Storage triggers.
- Updated Firebase Storage Security rules to default-open (`allow read, write: if true;`) to facilitate the rapid 5-student MVP beta phase.
- Cleaned up React Native frontend: Deleted legacy `app.tsx`, established `App.tsx` as the single source of truth, and repaired broken `@/` relative imports in `ProfileScreen.tsx`.
- Successfully bundled the React Native code (`npx expo export -c`) and queued the first Android APK compile via Expo Application Services (EAS) `preview` profile for device-native testing.

## Future Enhancements

- [ ] Push notifications for deadlines
- [ ] Dark mode support
- [ ] Offline sync with SQLite
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Study groups and collaboration
- [ ] Grade prediction ML model
- [ ] Voice notes for assignments
- [ ] Sharing study materials

## Dependencies

- **react-native**: UI framework
- **expo**: Managed React Native platform
- **@react-navigation**: Navigation library
- **@react-navigation/bottom-tabs**: Tab navigation
- **@expo/vector-icons**: Icon library
- **react-native-gesture-handler**: Gesture support
- **react-native-reanimated**: Animations
- **expo-splash-screen**: Splash screen

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.

---

Made with ❤️ for students
