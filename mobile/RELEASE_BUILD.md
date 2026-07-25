# Release build (Google Play)

The app uses **Google Places API** for destination search. The API key is injected at **build time**. If you build without it, the release app will have no destination/address suggestions.

## 1. Set the Google Maps API key for release

1. Copy the example file and add your key:
   ```bash
   cp dart_defines.json.example dart_defines.json
   ```
2. Edit `dart_defines.json` and replace `YOUR_GOOGLE_MAPS_PLACES_API_KEY` with your real **Google Places API key** (same key you use for debug, or a separate key for production).

## 2. Build the app bundle

Always pass the defines file when building for release:

```bash
flutter clean
flutter pub get
flutter build appbundle --release --dart-define-from-file=dart_defines.json
```

The output is: `build/app/outputs/bundle/release/app-release.aab`

**Without** `--dart-define-from-file=dart_defines.json`, the release build will have an empty API key and destination/Places search will not work.

## 3. Allow the release app in Google Cloud (API key restrictions)

If your **Android** API key in Google Cloud is restricted by app (SHA-1 + package name), you must add the **release** certificate so the Play build is allowed.

1. Get the SHA-1 of your **release** keystore:
   ```bash
   keytool -list -v -keystore android/app/release-keystore.jks -alias release
   ```
   (Use the same path/alias as in `android/key.properties`.)

2. If you use **Google Play App Signing**, also get the **App signing key certificate** SHA-1 from Play Console:  
   **Your app → Setup → App signing** → copy the SHA-1 under "App signing key certificate".

3. In **Google Cloud Console** → **APIs & Services** → **Credentials** → open your **Android** API key:
   - Under "Application restrictions" → "Android apps", add:
     - Package name: `com.addisway.negadras`
     - SHA-1: your **release** keystore SHA-1
     - If using Play App Signing, also add the **App signing key certificate** SHA-1 from step 2.

4. Ensure these APIs are **enabled** for the project:
   - **Places API** (for autocomplete and place details)
   - **Maps SDK for Android** (if you use the map)

Then rebuild and upload a new AAB. Destination fetch by Google Maps/Places will work in the published app once the key is in the build and the release SHA-1 is allowed.
