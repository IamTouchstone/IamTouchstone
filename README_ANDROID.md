# Android Packaging for Clikko

This repository is a web-backed Node/Express app. You can wrap it into an Android app using Capacitor.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize Capacitor:
   ```bash
   npm run android:init
   ```

3. Add the Android platform:
   ```bash
   npm run android:add
   ```

4. Copy the web assets into the Android project:
   ```bash
   npm run android:copy
   ```

5. Open Android Studio:
   ```bash
   npm run android:open
   ```

## Build the APK

In Android Studio, build a debug or release APK. The default debug APK path is:

- `android/app/build/outputs/apk/debug/app-debug.apk`

For a release build, use Android Studio's build menu or Gradle tasks.

## Notes

- The server must be running locally if the app relies on `/api/*` endpoints.
- If you want the Android app to bundle the backend, a separate Android-native backend or online API endpoint is required.
