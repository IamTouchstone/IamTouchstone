# Java & Android SDK Setup Guide for Windows

## Step 1: Install Java Development Kit (JDK)

### Option A: Using Chocolatey (Easiest)
```powershell
# Install Chocolatey first if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install JDK 17 or 21
choco install openjdk -y
```

### Option B: Manual Download
1. Go to https://adoptium.net/
2. Download "Temurin 17 LTS" or "Temurin 21" for Windows x64
3. Run the installer and follow the prompts
4. Accept the default installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x` or similar)

## Step 2: Set JAVA_HOME Environment Variable

### Windows 10/11:
1. **Open Settings** → **Environment Variables**
   - Press `Win + X`, search "Environment Variables"
   - Or: Right-click **This PC** → **Properties** → **Advanced system settings** → **Environment Variables**

2. **Under "System variables"**, click **New** and add:
   - **Variable name:** `JAVA_HOME`
   - **Variable value:** Path to your JDK installation
     - Example: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x`
     - Or: `C:\Program Files\Java\openjdk-17`

3. **Edit the "Path" variable** and add:
   - `%JAVA_HOME%\bin`

4. Click **OK** and restart PowerShell

### Verify Installation:
```powershell
java -version
javac -version
```

## Step 3: Install Android SDK

### Option A: Using Android Studio (Recommended)
1. Download Android Studio: https://developer.android.com/studio
2. Run the installer and follow the setup wizard
3. During setup, install:
   - Android SDK
   - Android SDK Platform Tools
   - Android SDK Build Tools

### Option B: Using Command Line (cmdline-tools)
1. Create a directory for Android SDK:
```powershell
mkdir $env:USERPROFILE\AppData\Local\Android\Sdk
```

2. Download cmdline-tools from: https://developer.android.com/studio#command-tools
   - Unzip to: `$env:USERPROFILE\AppData\Local\Android\Sdk\cmdline-tools\latest`

3. Run the SDK manager to install required components:
```powershell
$env:ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"
& $env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

## Step 4: Set ANDROID_HOME Environment Variable

1. **Open Environment Variables** (same as Step 2)
2. Add **System variable**:
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk`

3. **Edit the "Path" variable** and add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\build-tools\34.0.0` (use the version you installed)
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`

4. Click **OK** and restart PowerShell

### Verify Installation:
```powershell
$env:ANDROID_HOME
adb version
```

## Step 5: Build the Clikko APK

Once both are installed and environment variables are set, build the APK:

```powershell
cd c:\clikko-local\android
.\gradlew.bat assembleRelease
```

### Build Output:
- **Release APK:** `c:\clikko-local\android\app\build\outputs\apk\release\app-release.apk`
- **Debug APK:** `c:\clikko-local\android\app\build\outputs\apk\debug\app-debug.apk`

## Troubleshooting

### "JAVA_HOME is not set"
```powershell
# Set temporarily in current session
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
$env:ANDROID_HOME = "C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk"
```

### Gradle build fails
1. Clear Gradle cache:
```powershell
cd c:\clikko-local\android
.\gradlew.bat clean
```

2. Try building again:
```powershell
.\gradlew.bat assembleRelease
```

### No Android SDK components
Run the SDK manager to install required packages:
```powershell
$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat --list
$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-34" "build-tools;34.0.0"
```

## Next Steps

After building the APK successfully:
1. Install on Android device: `adb install app-release.apk`
2. Upload to GitHub release
3. Share download link: `https://github.com/<username>/clikko-local/releases/download/v1.3.0/clikko-local.apk`
