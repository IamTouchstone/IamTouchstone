# 1. Build the modern, offline-ready web client assets
npm run build

# 2. Synchronize these assets into the Android native assets wrapper
node sync-assets.js

# 3. Enter the android directory and assemble the release package
cd android
./gradlew assembleRelease