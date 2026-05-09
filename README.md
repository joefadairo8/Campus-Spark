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

### 🛡️ Granular Budgeting & Verifiable Execution (May 9, 2026 - Update)
- 💰 **Custom Budget Allocation**: Brands can now pre-lock a total campaign budget and allocate unique amounts to different influencers, drawing from the locked pool rather than the main balance.
- 🔄 **Report Revision Workflow**: Implemented a robust feedback loop. Brands can reject influencer reports with specific revision notes, and influencers can edit/resubmit their work until it meets approval standards.
- 📸 **Visual Reach Metrics**: Integrated Cloudinary for verifiable proof of performance. Influencers can now upload screenshots of their reach and engagement metrics directly within their execution reports.
- 🕰️ **Legacy Compatibility Layer**: Built a "Balance-based" fallback system that allows older campaigns created before the budget locking system to continue functioning seamlessly with the new reporting and revision tools.
- 🏦 **Admin Disbursement Preview**: Enhanced the Super Admin terminal with a full-detail preview modal for withdrawal requests, ensuring accurate offline transfers to Nigerian bank accounts.

### 🛡️ Direct Sponsorship & Automated Financial Hub (May 2, 2026 - Update)
- 💸 **Direct Sponsorship Engine**: Brands can now sponsor campus events directly from their wallet balance. The system handles atomic transfers, 10% platform commission deduction, and immediate credit to organizations.
- 🤝 **Automated Approval Bypass**: Sponsorship payments are now treated as "paid and confirmed" instantly, removing redundant approval steps for organizations once funds are processed.
- 🏢 **Partner Hub for Brands**: Launched a specialized "Partner Hub" for brands to discover and propose strategic non-sponsorship collaborations with organizations and other brands.
- 🎓 **Ambassador & Volunteer Hub**: Influencers now have a dedicated space to apply for long-term Brand Ambassador roles or volunteer for specific campus events, separate from campaign gig applications.
- 🏧 **Immediate Wallet Visibility**: Organizations now feature a real-time "Wallet Strip" in their main dashboard, providing instant visibility into available funds and locked escrow without extra navigation.
- 📊 **Platform Revenue Engine**: Admins can now monitor platform-wide revenue generation (commissions, listing fees) in real-time through the updated Super Admin Dashboard.

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
*Last Updated: May 9, 2026 (v3.0)*
*Created with ❤️ for the Nigerian Campus Community.*