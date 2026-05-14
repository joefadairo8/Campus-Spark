# Campus Spark Nigeria ⚡

**Campus Spark** is a premium digital ecosystem designed to bridge the gap between **Creators**, **Organizations**, and **Brands** in the Nigerian campus landscape. It provides a centralized hub for campus gigs, sponsorships, and event management.

---

## 👥 Stakeholders

1. **Creators**: Youth looking to monetize their influence and build their professional resume.
2. **Organizations**: Societies, clubs, and interest groups seeking funding and partnerships.
3. **Brands**: Companies looking to reach the Gen-Z market through authentic collaborations.
4. **Admins**: Platform moderators overseeing the network health and financial ledger.

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
4.  **Financial Ecosystem**: Integrated wallet system with escrow for campaign security.
5.  **Super Admin Hub**: Comprehensive platform-wide monitoring and moderation.

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

## 🔐 Firestore Security Rules (V2)
Paste the following into your Firebase Console under Firestore → Rules for the platform to function with full administrative oversight:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function isOwner(userId) { return isAuth() && request.auth.uid == userId; }
    function isAdmin() { 
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin'; 
    }

    match /users/{userId} {
      allow read: if isAuth();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    match /gigs/{gigId} {
      allow read: if true;
      allow create: if isAuth();
      allow update, delete: if isAuth() && (resource.data.brandId == request.auth.uid || isAdmin());
      match /applications/{appId} {
        allow read, write: if isAuth();
        allow delete: if isAdmin();
      }
    }
    match /wallets/{userId} {
      allow read, write: if isAuth();
      allow delete: if isAdmin();
    }
    match /transactions/{id} {
      allow read, create: if isAuth();
      allow delete: if isAdmin();
    }
    // ... apply similar isAdmin() patterns to proposals, events, and allocations
  }
}
```

---

### 🛡️ Platform Rebranding & Creator Economy (May 14, 2026 - Update)
### [v4.1] - Terminology Migration (Creator & Organization)
- System-wide replacement of "Student" terminology with **"Creator"** for individuals and **"Organization"** for groups.
- Renamed `student-dashboard` route to `creator-dashboard`.
- Updated navigation labels, landing pages, and type definitions for a more professional brand identity.
- Refactored `UserRole` and `UserType` enums for consistency.

### [v4.0] - Platform Rebranding
- 🏷️ **Creator Terminology Migration**: Fully transitioned the platform from "Ambassador/Influencer" to **"Creator"** to better reflect the modern digital economy and empower our user base.
- 💰 **Custom Budget Allocation**: Brands can now pre-lock a total campaign budget and allocate unique amounts to different creators, drawing from the locked pool rather than the main balance.
- 🔄 **Report Revision Workflow**: Implemented a robust feedback loop. Brands can reject creator reports with specific revision notes, and creators can edit/resubmit their work until it meets approval standards.
- 📸 **Visual Reach Metrics**: Integrated Cloudinary for verifiable proof of performance. Creators can now upload screenshots of their reach and engagement metrics directly within their execution reports.
- 🕰️ **Legacy Compatibility Layer**: Built a "Balance-based" fallback system that allows older campaigns created before the budget locking system to continue functioning seamlessly with the new reporting and revision tools.
- 🏦 **Admin Disbursement Preview**: Enhanced the Super Admin terminal with a full-detail preview modal for withdrawal requests, ensuring accurate offline transfers to Nigerian bank accounts.

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
3. **Deploy**:
```bash
   firebase deploy
```

### 🌐 Live URL
```
https://campus-spark-3a55d.web.app
```

---
*Last Updated: May 14, 2026 (v4.0)*
*Created with ❤️ for the Nigerian Campus Community.*