# Campus Spark Nigeria ⚡

**Campus Spark** is a premium digital ecosystem designed to bridge the gap between **Students**, **Organizations**, and **Brands** in the Nigerian campus landscape. It provides a centralized hub for campus gigs, sponsorships, and event management.

---

## 👥 Stakeholders
- **Students / Ambassadors**: Discover gigs, build portfolios, and earn.
- **Brands / Agencies**: Launch campus campaigns and recruit top student talent.
- **Student Organizations**: Seek sponsorships for events and manage partnerships.
- **Super Admins**: Oversee the entire ecosystem, monitor financials, and manage platform integrity.

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

### 🛡️ Super Admin & Platform Oversight (May 2026)
- 🏛️ **Super Admin Hub**: Launched a comprehensive management suite featuring **Network Pulse** (Analytics), **Platform Ledger** (Financial Audit), and **Campaign Monitor**.
- 🔐 **Secluded Admin Terminal**: Implemented a dedicated administrative gateway at `/admin` with a high-security "System Authority" theme and strict role enforcement.
- 💸 **Platform-Wide Ledger**: Centralized monitoring of all financial activity including top-ups, escrow locks, and influencer payouts.
- 🛡️ **Administrative Moderation**: Empowered admins with tools to delete stale records, moderate campaigns, and promote users to administrative levels directly from the dashboard.
- 📋 **Enhanced Report Viewer**: Brands now have access to a full **Execution Report Viewer** to audit influencer submissions and evidence links before releasing escrowed funds.
- ⚡ **Multi-Pitch Applications**: Influencers can now submit multiple refined pitches for a single campaign, removing the "one-application-only" barrier.
- 🔗 **Evidence Link Integration**: Standardized the collection and display of external evidence links (drive, social media, screenshots) for campaign verification.

### 🏗️ Professional Creator Workspace & UI Refinement
- 💰 **Wallet & Earning Strip**: Integrated real-time Available vs Pending balance visibility in dashboard headers.
- 📦 **Campaign Execution Flow**: Structured workflow for influencers to manage active work and track payment approvals.
- 🏧 **Withdrawal System**: Automated request flow for influencers to withdraw earnings to Nigerian bank accounts.
- ✅ **Theme Architecture Stabilization**: Full CSS variable implementation for seamless Light/Dark mode transitions.
- ✅ **Solid Button Standardization**: High-contrast, role-neutral button design platform-wide.

### 🛠️ Key Technical Improvements
- ✅ **Real-Time Platform Stats**: Implemented server-side (firebase.ts) data aggregation for platform-wide analytics.
- ✅ **Security Rule Hardening**: Integrated `isAdmin()` helper for robust role-based access control (RBAC).
- ✅ **API Robustness**: Expanded `apiClient` with comprehensive logging and error handling for all CRUD operations.
- ✅ **User Profile Enrichment**: Optimized data fetching to automatically sync user profiles across all partnership and gig interactions.

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
*Last Updated: May 1, 2026*
*Created with ❤️ for the Nigerian Campus Community.*