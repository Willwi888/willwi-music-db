<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Willwi Music Database Manager

A music catalog management system powered by Supabase and React.

View your app in AI Studio: https://ai.studio/apps/drive/1WSRBzhQ0sUd-5qPLnGHnOB6YW98ba5J5

## 🚀 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GEMINI_API_KEY=your-gemini-key-here  # Optional, for chat features
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

## 📊 Supabase Database Setup

Ensure your Supabase project has a `songs` table with the following structure:

```sql
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "versionLabel" TEXT,
  "coverUrl" TEXT NOT NULL,
  language TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "releaseDate" TEXT NOT NULL,
  "isEditorPick" BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  isrc TEXT,
  upc TEXT,
  "spotifyId" TEXT,
  "musicBrainzId" TEXT,
  
  -- External Links
  "youtubeUrl" TEXT,
  "musixmatchUrl" TEXT,
  "youtubeMusicUrl" TEXT,
  "spotifyLink" TEXT,
  "appleMusicLink" TEXT,
  
  -- Content
  lyrics TEXT,
  description TEXT,
  credits TEXT,
  
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON songs
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
-- Adjust these policies based on your security requirements
CREATE POLICY "Allow authenticated users to insert" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON songs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON songs
  FOR DELETE USING (auth.role() = 'authenticated');
```

## 🚀 Deploy to Google Cloud Run

### Environment Variables Setup

In Google Cloud Run, configure the following environment variables:

```bash
VITE_SUPABASE_URL=https://rzxqseimxhbokrhcdjbi.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key  # Optional
```

### Deployment Command

```bash
gcloud run deploy willwi-db \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars VITE_SUPABASE_URL=https://rzxqseimxhbokrhcdjbi.supabase.co,VITE_SUPABASE_ANON_KEY=your_key,VITE_GEMINI_API_KEY=your_key
```

## ✨ Features

- ✅ **Cloud-based Storage**: Data stored in Supabase PostgreSQL
- ✅ **Real-time Sync**: Admin updates reflect immediately on the website
- ✅ **Self-hosted**: Full control over your music catalog
- ✅ **Multi-language Support**: Support for multiple language catalogs
- ✅ **AI Integration**: Optional Google Gemini AI for chat features

## 🔧 Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (Optional)
- **Deployment**: Google Cloud Run

## 📝 Notes

### Removing Google Gemini AI (Optional)

If you want to completely remove the Gemini AI dependency:

1. Delete `services/geminiService.ts`
2. Remove `@google/genai` from `package.json`
3. Remove chat-related UI components
4. Remove `VITE_GEMINI_API_KEY` from environment variables

