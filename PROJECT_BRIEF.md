# Campus Spark - Project Brief

## 🚀 Overview
**Campus Spark** is a multi-role digital ecosystem designed to bridge the gap between **Students**, **Organizations**, and **Brands**. It provides a centralized hub for campus gigs, partnerships, and event management, empowering students to build their portfolios while offering brands and organizations a direct line to campus communities.

---

## 👥 Stakeholders & Roles
The platform caters to four distinct user roles, each with a tailored experience:

1.  **Students**:
    - Discover and apply for "Gigs" (brand ambassadorships, tasks, etc.).
    - Submit "Campaign Reports" to demonstrate completed work.
    - Build a professional digital profile.
2.  **Brands**:
    - Post Gigs and review student applications.
    - Approve or request revisions on campaign reports.
    - Partner with Student Organizations for larger initiatives.
3.  **Student Organizations (Clubs)**:
    - Host and promote campus events.
    - Seek sponsorships and partnerships from brands via direct proposals.
4.  **Admin**:
    - Holistic view of platform activity (users, gigs, proposals).
    - Management of platform users and system oversight.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (v18) with Vite.
- **Language**: TypeScript.
- **Styling**: Vanilla CSS with a focus on modern, responsive design.
- **Icons**: Lucide React.
- **State/Routing**: Custom state-based routing and localStorage-driven authentication.

### Backend & Database
- **Server**: Node.js with Express (v2 architecture).
- **ORM**: Prisma Client.
- **Database**: SQLite (Development) / Scalable via Prisma.
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt for password hashing.
- **Compatibility Layer**: A custom `firebase.ts` wrapper allows the frontend to interact with the custom Node API using familiar Firebase-like syntax (`getDoc`, `addDoc`, etc.).

---

## 🏗️ Core Features

### 1. Gig Management System
- **Discovery**: Students can browse open gigs.
- **Application**: Multi-step application process with professional pitches.
- **Workflow**: `Open` -> `In Progress` -> `Reviewing` -> `Completed`.
- **Reporting**: Students submit proof of work (links, images, text) for brand approval.

### 2. Partnership & Proposal Engine
- **Collaboration**: Organizations can send structured proposals (budget, timeline, message) to brands.
- **Status Tracking**: Management of proposal states (`Pending`, `Accepted`, `Rejected`).

### 3. Event Management
- **Centralized Listings**: Dedicated page for all campus-wide events.
- **Hosting**: Organizations can publish events with target sponsorship details.

### 4. Notification System
- Real-time in-app alerts for critical actions (gig approvals, proposal updates, etc.).

---

## 📂 Project Structure
```text
Campus Spark/
├── components/          # UI Components & Dashboard Pages
├── server/              # Backend Express Application
│   ├── prisma/          # Database Schema (schema.prisma)
│   ├── src/             # API Implementation
│   └── public/          # Static Uploads (Gig reports, Profile images)
├── public/              # Frontend static assets
├── firebase.ts          # API/DB shim (routes to custom server)
├── types.ts             # Global TypeScript interfaces
└── constants.tsx        # UI constants & configuration
```

---

## 🔧 Development & Setup
- **Frontend Dev**: `npm run dev`
- **Backend Dev**: `npm run dev-backend` (from server folder)
- **Full Stack**: `npm run dev-full` (runs both concurrently)

---
*Last Updated: March 2026*
