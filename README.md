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

### 🛡️ Direct Sponsorship & Automated Financial Hub (May 2, 2026 - Update)
- 💸 **Direct Sponsorship Engine**: Brands can now sponsor campus events directly from their wallet balance. The system handles atomic transfers, 10% platform commission deduction, and immediate credit to organizations.
- 🤝 **Automated Approval Bypass**: Sponsorship payments are now treated as "paid and confirmed" instantly, removing redundant approval steps for organizations once funds are processed.
- 🏢 **Partner Hub for Brands**: Launched a specialized "Partner Hub" for brands to discover and propose strategic non-sponsorship collaborations with organizations and other brands.
- 🎓 **Ambassador & Volunteer Hub**: Influencers now have a dedicated space to apply for long-term Brand Ambassador roles or volunteer for specific campus events, separate from campaign gig applications.
- 🏧 **Immediate Wallet Visibility**: Organizations now feature a real-time "Wallet Strip" in their main dashboard, providing instant visibility into available funds and locked escrow without extra navigation.
- 📊 **Platform Revenue Engine**: Admins can now monitor platform-wide revenue generation (commissions, listing fees) in real-time through the updated Super Admin Dashboard.

### 🛡️ Campaign Approval & Payment Integrity (May 2, 2026)
- 🔒 **Mandatory "No Report, No Payout" Workflow**: Funds are now strictly locked in escrow until an influencer submits a detailed execution report and the brand explicitly approves it.
- 💰 **Automated Escrow Management**: Funds are automatically moved from a Brand's available balance to a locked Escrow account the moment an influencer is assigned/allocated to a campaign.
- 📋 **Integrated Reporting Interface**: Influencers have a dedicated "Manage Work" portal to provide written reports and evidence links (social media, Drive, etc.) for review.
- ✅ **Brand-Led Release**: Brands can no longer release payments until a submission is received. The platform now enforces a `Submitted -> Approved -> Paid` lifecycle.
- 🏦 **Financial Accuracy**: The `WalletService` now uses atomic transactions to handle payouts, platform commissions (10%), and balance updates simultaneously, preventing race conditions.

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
*Last Updated: May 2, 2026 (v2.5)*
*Created with ❤️ for the Nigerian Campus Community.*