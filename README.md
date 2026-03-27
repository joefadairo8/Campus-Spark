# Campus Spark Nigeria ⚡

**Campus Spark** is a premium digital ecosystem designed to bridge the gap between **Students**, **Organizations**, and **Brands** in the Nigerian campus landscape. It provides a centralized hub for campus gigs, sponsorships, and event management.

---

## 👥 Stakeholders
- **Students / Ambassadors**: Discover gigs, build portfolios, and earn.
- **Brands / Agencies**: Launch campus campaigns and recruit top student talent.
- **Student Organizations**: Seek sponsorships for events and manage partnerships.
- **Admin**: Oversee the entire ecosystem and manage platform integrity.

---

## 🛠️ Technology Stack
- **Frontend**: React (v18) + Vite + TypeScript
- **Styling**: Modern Vanilla CSS (Premium, high-contrast aesthetic)
- **Backend / Auth / DB**: **Firebase** (Auth & Cloud Firestore)
- **Hosting**: Firebase Hosting

---

## 🏗️ Core Features
1.  **Gig Management**: Discovery, application, and campaign reporting workflow.
2.  **Partnership Engine**: Structured proposals between organizations and brands.
3.  **Event Hub**: Centralized campus event listings with sponsorship tracking.
4.  **Real-time Notifications**: Instant alerts for applications, approvals, and messages.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Account

### Setup
1.  **Clone the project**:
```bash
    git clone https://github.com/joefadairo8/Campus-Spark.git
    cd Campus-Spark
```
2.  **Install dependencies**:
```bash
    npm install
```
3.  **Firebase Configuration**:
    - Open `firebase.ts`.
    - Ensure your `firebaseConfig` object matches your project credentials from the Firebase Console.
4.  **Run Development Server**:
```bash
    npm run dev
```
5.  **Open in browser**:
```
    http://localhost:3000
```

---

## 🔐 Firestore Security Rules
To ensure the app functions correctly, paste the following into your Firebase Console under Firestore → Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /gigs/{gigId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /applications/{appId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /proposals/{proposalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🔧 Recent Updates (March 2026)

### Bug Fixes
- ✅ Fixed missing `apiClient` export in `firebase.ts` that was causing app-wide crashes
- ✅ Fixed Navbar crash caused by undefined user `name` on login
- ✅ Fixed `App.tsx` authentication flow to fetch full user profile from Firestore
- ✅ Added `get`, `post`, `put` and `delete` methods to `apiClient` for dashboard data fetching

### Firebase Setup
- ✅ Created Cloud Firestore database (us-central1)
- ✅ Configured Firestore security rules for all collections

---

## 📦 Deployment
The project is optimized for **Firebase Hosting**:
1. `npm run build`
2. `firebase deploy`

---

---
*Last Updated: March 2026*
*Created with ❤️ for the Nigerian Campus Community.*