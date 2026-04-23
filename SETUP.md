# Study Manager — Setup Guide

## Install dependencies
```bash
npm install
cd ios && pod install && cd ..   # iOS only
```

## Android — required permission
Add to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

## Android — notification icon
Create a white-on-transparent 24dp icon and place it at:
`android/app/src/main/res/drawable/ic_notification.png`
Without it, notifications still work but may show a default icon.

## iOS — Push Notifications capability
1. Open Xcode → select your target
2. Signing & Capabilities → `+ Capability` → Push Notifications
3. Also add Background Modes → Remote notifications

## Firestore security rules
Paste in Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /subjects/{doc} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
    match /tasks/{doc} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Firestore indexes
Run the app — Firebase will print console links to auto-create any needed indexes.
Or create manually:
| Collection | Fields               |
|------------|----------------------|
| tasks      | userId ASC, done ASC, date ASC |
| subjects   | userId ASC, createdAt ASC      |

## Asset required
Place your logo at: `assets/logo.png`
(Referenced in WelcomeScreen.js)
