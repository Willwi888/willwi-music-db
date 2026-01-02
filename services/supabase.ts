import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Song } from '../types';

// Extend ImportMeta interface for Vite environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Operating in offline mode.');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  }

  return supabaseClient;
};

export const supabaseService = {
  /**
   * Get all songs from Supabase, sorted by releaseDate descending
   */
  async getAllSongs(): Promise<Song[]> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping getAllSongs');
        return [];
      }

      const { data, error } = await client
        .from('songs')
        .select('*')
        .order('releaseDate', { ascending: false });

      if (error) {
        console.error('Supabase getAllSongs error:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} songs from Supabase`);
      return data || [];
    } catch (error) {
      console.error('Failed to get all songs from Supabase:', error);
      return [];
    }
  },

  /**
   * Get a single song by ID from Supabase
   */
  async getSong(id: string): Promise<Song | null> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping getSong');
        return null;
      }

      const { data, error } = await client
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Supabase getSong error for id ${id}:`, error);
        throw error;
      }

      console.log(`Successfully fetched song ${id} from Supabase`);
      return data;
    } catch (error) {
      console.error(`Failed to get song ${id} from Supabase:`, error);
      return null;
    }
  },

  /**
   * Add a new song to Supabase
   */
  async addSong(song: Song): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping addSong');
        throw new Error('Supabase not configured');
      }

      const { error } = await client
        .from('songs')
        .insert(song);

      if (error) {
        console.error('Supabase addSong error:', error);
        throw error;
      }

      console.log(`Successfully added song ${song.id} to Supabase`);
    } catch (error) {
      console.error(`Failed to add song ${song.id} to Supabase:`, error);
      throw error;
    }
  },

  /**
   * Update an existing song in Supabase
   */
  async updateSong(song: Song): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping updateSong');
        throw new Error('Supabase not configured');
      }

      const { error } = await client
        .from('songs')
        .update(song)
        .eq('id', song.id);

      if (error) {
        console.error('Supabase updateSong error:', error);
        throw error;
      }

      console.log(`Successfully updated song ${song.id} in Supabase`);
    } catch (error) {
      console.error(`Failed to update song ${song.id} in Supabase:`, error);
      throw error;
    }
  },

  /**
   * Delete a song from Supabase
   */
  async deleteSong(id: string): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping deleteSong');
        throw new Error('Supabase not configured');
      }

      const { error } = await client
        .from('songs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase deleteSong error:', error);
        throw error;
      }

      console.log(`Successfully deleted song ${id} from Supabase`);
    } catch (error) {
      console.error(`Failed to delete song ${id} from Supabase:`, error);
      throw error;
    }
  },

  /**
   * Bulk add multiple songs to Supabase
   */
  async bulkAdd(songs: Song[]): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping bulkAdd');
        throw new Error('Supabase not configured');
      }

      const { error } = await client
        .from('songs')
        .insert(songs);

      if (error) {
        console.error('Supabase bulkAdd error:', error);
        throw error;
      }

      console.log(`Successfully bulk added ${songs.length} songs to Supabase`);
    } catch (error) {
      console.error(`Failed to bulk add ${songs.length} songs to Supabase:`, error);
      throw error;
    }
  },

  /**
   * Clear all songs from Supabase
   */
  async clearAllSongs(): Promise<void> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping clearAllSongs');
        throw new Error('Supabase not configured');
      }

      // Get all song IDs first, then delete them
      const { data: songs, error: fetchError } = await client
        .from('songs')
        .select('id');

      if (fetchError) {
        console.error('Supabase clearAllSongs fetch error:', fetchError);
        throw fetchError;
      }

      if (songs && songs.length > 0) {
        const songIds = songs.map((song: { id: string }) => song.id);
        const { error: deleteError } = await client
          .from('songs')
          .delete()
          .in('id', songIds);

        if (deleteError) {
          console.error('Supabase clearAllSongs delete error:', deleteError);
          throw deleteError;
        }
      }

      console.log('Successfully cleared all songs from Supabase');
    } catch (error) {
      console.error('Failed to clear all songs from Supabase:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time changes in the songs table
   */
  subscribeToSongs(callback: (songs: Song[]) => void): (() => void) | null {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.log('Supabase not configured, skipping subscribeToSongs');
        return null;
      }

      console.log('Setting up real-time subscription for songs');

      const subscription = client
        .channel('songs-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'songs' },
          async () => {
            // Fetch updated data when any change occurs
            const songs = await supabaseService.getAllSongs();
            callback(songs);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        console.log('Unsubscribing from songs real-time updates');
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to subscribe to songs changes:', error);
      return null;
    }
  }
};
