import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rzxqseimxhbokrhcdjbi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eHFzZWlteGhib2tyaGNkamJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTQxMjAsImV4cCI6MjA4MDUzMDEyMH0.8SD3g8sj-3XHMX3e7u8xHOxuAWVwhG-6lcvAKP3VME0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Song type matching Supabase schema
export interface Song {
  id: string;
  title: string;
  version_label?: string;
  cover_url?: string;
  language?: string;
  project_type?: string;
  release_category?: string;
  release_company?: string;
  release_date?: string;
  is_editor_pick?: boolean;
  is_interactive_active?: boolean;
  is_official_exclusive?: boolean;
  isrc?: string;
  upc?: string;
  spotify_id?: string;
  spotify_link?: string;
  youtube_url?: string;
  description?: string;
  lyrics?: string;
  credits?: string;
  created_at?: string;
  updated_at?: string;
  cover_overlay_text?: string;
  publisher?: string;
  musicbrainz_id?: string;
  cloud_video_url?: string;
  custom_audio_link?: string;
  musixmatch_url?: string;
  youtube_music_url?: string;
  apple_music_link?: string;
  smart_link?: string;
  distrokid_manage_url?: string;
  audio_url?: string;
  internal_code?: string;
}

export interface Transaction {
  id: string;
  user_email: string;
  product_id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  stripe_session_id?: string;
  access_code?: string;
  created_at: string;
}
