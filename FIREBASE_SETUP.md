# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 3. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can add security rules later)
4. Select a location for your database
5. Click "Done"

## 4. Get Your Firebase Configuration

1. In your Firebase project, go to "Project Settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click the web app icon (</>) to add a web app if you haven't already
4. Register your app with a nickname
5. Copy the configuration object

## 5. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the values with your actual Firebase configuration.

## 6. Security Rules (Optional but Recommended)

In your Firestore Database, go to the "Rules" tab and update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This allows anyone to read products but only authenticated users to create/update them.

## 7. Run Your App

```bash
npm run dev
```

Your app should now be connected to Firebase with authentication and real-time database functionality!

## Features Added

- ✅ Firebase Authentication (Email/Password)
- ✅ Firestore Database integration
- ✅ Real-time data synchronization
- ✅ User authentication state management
- ✅ Sign up/Sign in forms
- ✅ Protected routes (only authenticated users can add products)
- ✅ User-specific data (products are associated with user IDs)
- ✅ Real-time voting updates
