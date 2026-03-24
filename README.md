<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1GO8yOqfIfoOYWDKHcvnya1aULj9YOA-5

## Deployment Guide

### Prerequisites
- Node.js (v18+)
- pnpm or npm

### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on the provided template (see `.env` for required variables).
4. Synchronize the database schema: `npx prisma db push`
5. (Optional) Seed the database: `npx tsx prisma/seed.ts`

### Frontend Setup
1. Install dependencies in the root: `npm install`
2. Create/Update `.env.local` with:
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-api.com/api/`).
3. Build the frontend: `npm run build`

### Running in Production
- **Backend**: In the `server` directory, run `npm run build` then `npm start`.
- **Frontend**: Serve the `dist` directory using a static file host (Vercel, Netlify, etc.).
