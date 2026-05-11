---
name: app-store-prep-reminder
description: Reminder to complete App Store prep checklist before finalizing
type: project
---

# App Store Prep Checklist

Before finalizing/publishing the remake app, complete these items:

1. **Set EXPO_PUBLIC_DEV_BYPASS=false** in production environment
2. **Implement actual YouCam API call** in `remake/lib/api/diagnosis.ts`
   - Get API key from youcam.com/developers
   - Set EXPO_PUBLIC_YOUCAM_API_KEY and EXPO_PUBLIC_YOUCAM_API_ENDPOINT
3. **Implement actual GPT-4o mini call** in `remake/lib/api/coaching.ts`
   - Set EXPO_PUBLIC_OPENAI_API_KEY if not already
4. **Consider upgrading to expo-secure-store** for profile photos (XOR obfuscation is not encryption)

**Current status:** API architecture is in place with placeholders on `api-architecture` branch.

## Why this matters
The app currently uses placeholder/mock AI responses. YouCam and OpenAI APIs need real credentials for production.