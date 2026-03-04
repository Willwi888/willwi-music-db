import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song } from '../types';
import { supabaseService } from './supabase';

interface WillwiDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'willwi-music-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WillwiDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<WillwiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          const store = db.createObjectStore('songs', { keyPath: 'id' });
          store.createIndex('by-date', 'releaseDate');
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  /**
   * Get all songs - tries Supabase first, falls back to IndexedDB
   */
  async getAllSongs(): Promise<Song[]> {
    try {
      // Try Supabase first
      const supabaseSongs = await supabaseService.getAllSongs();
      
      // null means Supabase is not configured, so use IndexedDB
      if (supabaseSongs === null) {
        console.log('Supabase not configured, using IndexedDB');
      } else {
        // Supabase is configured, use its data (even if empty)
        console.log(`Fetched ${supabaseSongs.length} songs from Supabase`);
        
        // Sync to IndexedDB as backup (background operation, don't block)
        Promise.resolve().then(async () => {
          try {
            const db = await initDB();
            const tx = db.transaction('songs', 'readwrite');
            // Update each song individually to preserve existing data
            await Promise.all(supabaseSongs.map(song => tx.store.put(song)));
            await tx.done;
          } catch (e) {
            console.warn('Failed to sync Supabase data to IndexedDB:', e);
          }
        });
        
        return supabaseSongs;
      }
    } catch (error) {
      console.warn('Failed to fetch from Supabase, falling back to IndexedDB:', error);
    }

    // Fallback to IndexedDB
    try {
      const db = await initDB();
      const songs = await db.getAll('songs');
      console.log('Fetched songs from IndexedDB (fallback)');
      return songs;
    } catch (error) {
      console.error('Failed to fetch from IndexedDB:', error);
      return [];
    }
  },

  /**
   * Get a single song - tries Supabase first, falls back to IndexedDB
   */
  async getSong(id: string): Promise<Song | undefined> {
    try {
      // Try Supabase first
      const supabaseSong = await supabaseService.getSong(id);
      if (supabaseSong) {
        console.log(`Fetched song ${id} from Supabase`);
        // Sync to IndexedDB as backup
        try {
          const db = await initDB();
          await db.put('songs', supabaseSong);
        } catch (e) {
          console.warn('Failed to sync song to IndexedDB:', e);
        }
        return supabaseSong;
      }
    } catch (error) {
      console.warn(`Failed to fetch song ${id} from Supabase, falling back to IndexedDB:`, error);
    }

    // Fallback to IndexedDB
    try {
      const db = await initDB();
      const song = await db.get('songs', id);
      console.log(`Fetched song ${id} from IndexedDB (fallback)`);
      return song;
    } catch (error) {
      console.error(`Failed to fetch song ${id} from IndexedDB:`, error);
      return undefined;
    }
  },

  /**
   * Add a song - writes to both Supabase and IndexedDB
   */
  async addSong(song: Song): Promise<void> {
    const errors: string[] = [];

    // Write to Supabase
    try {
      await supabaseService.addSong(song);
      console.log(`Added song ${song.id} to Supabase`);
    } catch (error) {
      console.error(`Failed to add song ${song.id} to Supabase:`, error);
      errors.push('Supabase');
    }

    // Write to IndexedDB
    try {
      const db = await initDB();
      await db.put('songs', song);
      console.log(`Added song ${song.id} to IndexedDB`);
    } catch (error) {
      console.error(`Failed to add song ${song.id} to IndexedDB:`, error);
      errors.push('IndexedDB');
    }

    if (errors.length === 2) {
      throw new Error(`Failed to add song to both ${errors.join(' and ')}`);
    }
  },

  /**
   * Update a song - writes to both Supabase and IndexedDB
   */
  async updateSong(song: Song): Promise<void> {
    const errors: string[] = [];

    // Update in Supabase
    try {
      await supabaseService.updateSong(song);
      console.log(`Updated song ${song.id} in Supabase`);
    } catch (error) {
      console.error(`Failed to update song ${song.id} in Supabase:`, error);
      errors.push('Supabase');
    }

    // Update in IndexedDB
    try {
      const db = await initDB();
      await db.put('songs', song);
      console.log(`Updated song ${song.id} in IndexedDB`);
    } catch (error) {
      console.error(`Failed to update song ${song.id} in IndexedDB:`, error);
      errors.push('IndexedDB');
    }

    if (errors.length === 2) {
      throw new Error(`Failed to update song in both ${errors.join(' and ')}`);
    }
  },

  /**
   * Delete a song - deletes from both Supabase and IndexedDB
   */
  async deleteSong(id: string): Promise<void> {
    const errors: string[] = [];

    // Delete from Supabase
    try {
      await supabaseService.deleteSong(id);
      console.log(`Deleted song ${id} from Supabase`);
    } catch (error) {
      console.error(`Failed to delete song ${id} from Supabase:`, error);
      errors.push('Supabase');
    }

    // Delete from IndexedDB
    try {
      const db = await initDB();
      await db.delete('songs', id);
      console.log(`Deleted song ${id} from IndexedDB`);
    } catch (error) {
      console.error(`Failed to delete song ${id} from IndexedDB:`, error);
      errors.push('IndexedDB');
    }

    if (errors.length === 2) {
      throw new Error(`Failed to delete song from both ${errors.join(' and ')}`);
    }
  },

  /**
   * Bulk add songs - writes to both Supabase and IndexedDB
   */
  async bulkAdd(songs: Song[]): Promise<void> {
    const errors: string[] = [];

    // Bulk add to Supabase
    try {
      await supabaseService.bulkAdd(songs);
      console.log(`Bulk added ${songs.length} songs to Supabase`);
    } catch (error) {
      console.error(`Failed to bulk add songs to Supabase:`, error);
      errors.push('Supabase');
    }

    // Bulk add to IndexedDB
    try {
      const db = await initDB();
      const tx = db.transaction('songs', 'readwrite');
      await Promise.all(songs.map(song => tx.store.put(song)));
      await tx.done;
      console.log(`Bulk added ${songs.length} songs to IndexedDB`);
    } catch (error) {
      console.error(`Failed to bulk add songs to IndexedDB:`, error);
      errors.push('IndexedDB');
    }

    if (errors.length === 2) {
      throw new Error(`Failed to bulk add songs to both ${errors.join(' and ')}`);
    }
  },

  /**
   * Clear all songs - clears from both Supabase and IndexedDB
   */
  async clearAllSongs(): Promise<void> {
    const errors: string[] = [];

    // Clear Supabase
    try {
      await supabaseService.clearAllSongs();
      console.log('Cleared all songs from Supabase');
    } catch (error) {
      console.error('Failed to clear songs from Supabase:', error);
      errors.push('Supabase');
    }

    // Clear IndexedDB
    try {
      const db = await initDB();
      await db.clear('songs');
      console.log('Cleared all songs from IndexedDB');
    } catch (error) {
      console.error('Failed to clear songs from IndexedDB:', error);
      errors.push('IndexedDB');
    }

    if (errors.length === 2) {
      throw new Error(`Failed to clear songs from both ${errors.join(' and ')}`);
    }
  }
};