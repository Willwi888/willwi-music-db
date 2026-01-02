<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WSRBzhQ0sUd-5qPLnGHnOB6YW98ba5J5

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables example:
   ```bash
   cp .env.example .env.local
   ```

3. Configure your environment variables in `.env.local`:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase Anonymous/Public Key
   - `VITE_GEMINI_API_KEY` - (Optional) Your Gemini API key if using AI features

4. Run the app:
   ```bash
   npm run dev
   ```

## Supabase Configuration

This application uses Supabase as the primary cloud database with IndexedDB as an offline fallback.

### Setting up Supabase

1. **Create a Supabase account** at [https://supabase.com](https://supabase.com)

2. **Create a new project** in your Supabase dashboard

3. **Create the `songs` table** with the following structure:

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  "versionLabel" TEXT,
  "coverUrl" TEXT NOT NULL,
  language TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "releaseDate" DATE NOT NULL,
  "isEditorPick" BOOLEAN NOT NULL DEFAULT false,
  
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient sorting by release date
CREATE INDEX idx_songs_release_date ON songs("releaseDate" DESC);
```

4. **Get your credentials**:
   - Go to Project Settings → API
   - Copy your **Project URL** (this is your `VITE_SUPABASE_URL`)
   - Copy your **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

5. **Add these credentials** to your `.env.local` file

### Data Storage Strategy

The application implements a dual-storage mechanism:

- **Primary**: Supabase (cloud database)
  - All data operations attempt to use Supabase first
  - Provides real-time sync across devices
  - Centralized data management

- **Fallback**: IndexedDB (local browser storage)
  - Used when Supabase is unavailable or not configured
  - Provides offline functionality
  - Automatically syncs with Supabase when available

### Field Definitions

Based on the `Song` interface in `types.ts`:

- **id** (UUID): Unique identifier for each song
- **title** (TEXT): Song title
- **versionLabel** (TEXT, optional): Version label (e.g., "Acoustic Ver.", "Remix")
- **coverUrl** (TEXT): URL to cover image
- **language** (TEXT): Song language (華語, 台語, 日語, 韓語, 英語, 泰語, 義大利語, 法語, 純音樂)
- **projectType** (TEXT): Project type (獨立發行, 泡麵聲學院)
- **releaseDate** (DATE): Release date
- **isEditorPick** (BOOLEAN): Editor's choice flag
- **isrc** (TEXT, optional): International Standard Recording Code
- **upc** (TEXT, optional): Universal Product Code
- **spotifyId** (TEXT, optional): Spotify ID for embedding
- **musicBrainzId** (TEXT, optional): MusicBrainz ID
- **youtubeUrl** (TEXT, optional): YouTube video URL
- **musixmatchUrl** (TEXT, optional): Musixmatch URL
- **youtubeMusicUrl** (TEXT, optional): YouTube Music URL
- **spotifyLink** (TEXT, optional): Spotify direct link
- **appleMusicLink** (TEXT, optional): Apple Music link
- **lyrics** (TEXT, optional): Song lyrics
- **description** (TEXT, optional): Song description
- **credits** (TEXT, optional): Producer, arranger credits
