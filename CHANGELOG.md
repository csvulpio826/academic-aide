# April 28, 2026 - Migration & UI Fixes

- **Cloud Sync**: Created GitHub repository (https://github.com/csvulpio826/academic-aide) and connected the local Windows project to the cloud to enable seamless pull/push code syncing.
- **Provider Migration**: Completely removed Anthropic (`@anthropic-ai/sdk`) and GLM integrations. Rewrote `aiService.ts` to natively use Gemini 2.5 Flash via the official Google API for chat functions.
- **UI & Crash Fixes**: 
  - Fixed a major React Native rendering bug in `App.tsx` where un-wrapped strings (spaces) caused crashes.
  - Resolved an immediate startup crash `TypeError: Cannot read property 'lg' of undefined` caused by `ProfileScreen.tsx` referencing outdated theme variables.
  - Enforced a uniform vivid blue (`#007AFF`) theme across tabs, buttons, and chat bubbles, replacing legacy black hardcodes.
