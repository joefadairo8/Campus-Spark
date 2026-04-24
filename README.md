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

## 🔧 Recent Updates (April 2026)

### Bug Fixes
- ✅ Fixed missing `apiClient` export in `firebase.ts` that was causing app-wide crashes
- ✅ Fixed Navbar crash caused by undefined user `name` on login
- ✅ Fixed `App.tsx` authentication flow to fetch full user profile from Firestore
- ✅ Added `get`, `post`, `put`, `patch` and `delete` methods to `apiClient` for dashboard data fetching
- ✅ Fixed logout flow — app now properly signs out from Firebase and redirects to home
- ✅ Fixed friendly error messages on registration (email already in use, weak password, etc.)
- ✅ Fixed `apiClient.get` to support query parameters for filtering by role, status, brand and studentId
- ✅ Fixed TypeScript errors across `StudentDashboard.tsx` and `BrandDashboard.tsx`
- ✅ Brand dashboard talent directory now shows all registered student ambassadors
- ✅ Campus events now visible on both Brand and Student dashboards
- ✅ Fixed `apiClient.get` to support complex `OR` queries for proposals (senderId/recipientId)
- ✅ Fixed Talent Directory visibility mismatch between enum values and legacy database roles
- ✅ Fixed UI flickering/incorrect empty states by adding loading checks to Proposals and Events sections
- ✅ Fixed "Unknown User" display by implementing profile enrichment on the server side (firebase.ts)
- ✅ Added fallback to Email/Auth data for profiles with missing name information
- ✅ Standardized user ID handling across all dashboards to ensure reliable data filtering
- ✅ Fixed OrgDashboard runtime error on Brand Partnerships section
- ✅ Fixed profile update to use correct Firebase Auth user ID
- ✅ Fixed profile image upload using base64 encoding
- ✅ Fixed proposals communication — sender and recipient info now automatically saved when proposal is sent
- ✅ Fixed wrong name showing in OrgDashboard header
- ✅ Improved Brand Dashboard data fetching to correctly filter campaigns by brand name

### Firebase Setup
- ✅ Created Cloud Firestore database (us-central1)
- ✅ Configured Firestore security rules for all collections

---

## 📦 Deployment
The project is optimized for **Firebase Hosting**:

1. **Build the project**:
```bash
   npm run build
```
2. **Initialize Firebase** (first time only):
```bash
   firebase init
```
   - Select **Hosting**
   - Select **campus-spark-3a55d** as the project
   - Set public directory to **`dist`**
   - Configure as single page app: **Yes**
   - Automatic GitHub deploys: **No**

3. **Deploy**:
```bash
   firebase deploy
```

### 🌐 Live URL
```
https://campus-spark-3a55d.web.app
---

---
*Last Updated: April 2026*
*Created with ❤️ for the Nigerian Campus Community.*