import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Song, Language, ProjectType, SongContextType } from '../types';
import * as supabaseService from '../services/supabaseService';
import { Song as SupabaseSong } from '../services/supabaseClient';

const DataContext = createContext<SongContextType | undefined>(undefined);

// Convert Supabase song format to frontend Song format
function convertFromSupabase(s: SupabaseSong): Song {
  return {
    id: s.id,
    title: s.title,
    versionLabel: s.version_label || '',
    coverUrl: s.cover_url || '',
    language: (s.language as Language) || Language.Mandarin,
    projectType: (s.project_type as ProjectType) || ProjectType.Indie,
    releaseCategory: s.release_category || '',
    releaseCompany: s.release_company || '',
    releaseDate: s.release_date || '',
    isEditorPick: s.is_editor_pick || false,
    isInteractiveActive: s.is_interactive_active || false,
    isOfficialExclusive: s.is_official_exclusive || false,
    isrc: s.isrc || '',
    upc: s.upc || '',
    spotifyId: s.spotify_id || '',
    spotifyLink: s.spotify_link || '',
    youtubeUrl: s.youtube_url || '',
    description: s.description || '',
    lyrics: s.lyrics || '',
    credits: s.credits || '',
    coverOverlayText: s.cover_overlay_text || '',
    publisher: s.publisher || '',
    musicBrainzId: s.musicbrainz_id || '',
    cloudVideoUrl: s.cloud_video_url || '',
    customAudioLink: s.custom_audio_link || '',
    musixmatchUrl: s.musixmatch_url || '',
    youtubeMusicUrl: s.youtube_music_url || '',
    appleMusicLink: s.apple_music_link || '',
    smartLink: s.smart_link || '',
    distrokidManageUrl: s.distrokid_manage_url || '',
    audioUrl: s.audio_url || '',
    internalCode: s.internal_code || '',
  };
}

// Convert frontend Song format to Supabase format
function convertToSupabase(s: Partial<Song>): Partial<SupabaseSong> {
  const result: Partial<SupabaseSong> = {};
  
  if (s.id !== undefined) result.id = s.id;
  if (s.title !== undefined) result.title = s.title;
  if (s.versionLabel !== undefined) result.version_label = s.versionLabel;
  if (s.coverUrl !== undefined) result.cover_url = s.coverUrl;
  if (s.language !== undefined) result.language = s.language;
  if (s.projectType !== undefined) result.project_type = s.projectType;
  if (s.releaseCategory !== undefined) result.release_category = s.releaseCategory;
  if (s.releaseCompany !== undefined) result.release_company = s.releaseCompany;
  if (s.releaseDate !== undefined) result.release_date = s.releaseDate;
  if (s.isEditorPick !== undefined) result.is_editor_pick = s.isEditorPick;
  if (s.isInteractiveActive !== undefined) result.is_interactive_active = s.isInteractiveActive;
  if (s.isOfficialExclusive !== undefined) result.is_official_exclusive = s.isOfficialExclusive;
  if (s.isrc !== undefined) result.isrc = s.isrc;
  if (s.upc !== undefined) result.upc = s.upc;
  if (s.spotifyId !== undefined) result.spotify_id = s.spotifyId;
  if (s.spotifyLink !== undefined) result.spotify_link = s.spotifyLink;
  if (s.youtubeUrl !== undefined) result.youtube_url = s.youtubeUrl;
  if (s.description !== undefined) result.description = s.description;
  if (s.lyrics !== undefined) result.lyrics = s.lyrics;
  if (s.credits !== undefined) result.credits = s.credits;
  if (s.coverOverlayText !== undefined) result.cover_overlay_text = s.coverOverlayText;
  if (s.publisher !== undefined) result.publisher = s.publisher;
  if (s.musicBrainzId !== undefined) result.musicbrainz_id = s.musicBrainzId;
  if (s.cloudVideoUrl !== undefined) result.cloud_video_url = s.cloudVideoUrl;
  if (s.customAudioLink !== undefined) result.custom_audio_link = s.customAudioLink;
  if (s.musixmatchUrl !== undefined) result.musixmatch_url = s.musixmatchUrl;
  if (s.youtubeMusicUrl !== undefined) result.youtube_music_url = s.youtubeMusicUrl;
  if (s.appleMusicLink !== undefined) result.apple_music_link = s.appleMusicLink;
  if (s.smartLink !== undefined) result.smart_link = s.smartLink;
  if (s.distrokidManageUrl !== undefined) result.distrokid_manage_url = s.distrokidManageUrl;
  if (s.audioUrl !== undefined) result.audio_url = s.audioUrl;
  if (s.internalCode !== undefined) result.internal_code = s.internalCode;
  
  return result;
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load songs from Supabase
  const loadSongs = async () => {
    setIsLoading(true);
    try {
      const supabaseSongs = await supabaseService.getAllSongs();
      const convertedSongs = supabaseSongs.map(convertFromSupabase);
      // Sort by date descending
      const sorted = convertedSongs.sort((a, b) => 
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
      setSongs(sorted);
    } catch (err) {
      console.error("Failed to load songs from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize: Load data and subscribe to real-time updates
  useEffect(() => {
    loadSongs();
    
    // Subscribe to real-time changes
    const unsubscribe = supabaseService.subscribeSongs((supabaseSongs) => {
      const convertedSongs = supabaseSongs.map(convertFromSupabase);
      const sorted = convertedSongs.sort((a, b) => 
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
      setSongs(sorted);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addSong = async (song: Song): Promise<boolean> => {
    try {
      const supabaseSong = convertToSupabase(song);
      await supabaseService.createSong(supabaseSong);
      // Real-time subscription will update the state
      await loadSongs(); // Force refresh
      return true;
    } catch (e) {
      console.error("Supabase Add Error:", e);
      alert("儲存失敗：" + (e as Error).message);
      return false;
    }
  };

  const updateSong = async (id: string, updatedFields: Partial<Song>): Promise<boolean> => {
    try {
      const supabaseFields = convertToSupabase(updatedFields);
      await supabaseService.updateSong(id, supabaseFields);
      // Real-time subscription will update the state
      await loadSongs(); // Force refresh
      return true;
    } catch (e) {
      console.error("Supabase Update Error:", e);
      alert("更新失敗：" + (e as Error).message);
      return false;
    }
  };

  const deleteSong = async (id: string) => {
    if (window.confirm("確定要刪除這首歌嗎？此操作無法復原。")) {
      try {
        await supabaseService.deleteSong(id);
        // Real-time subscription will update the state
        await loadSongs(); // Force refresh
      } catch (e) {
        console.error("Supabase Delete Error:", e);
        alert("刪除失敗：" + (e as Error).message);
      }
    }
  };

  const getSong = (id: string) => songs.find(s => s.id === id);

  return (
    <DataContext.Provider value={{ songs, addSong, updateSong, deleteSong, getSong }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
