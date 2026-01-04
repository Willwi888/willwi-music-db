import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song } from '../types';

interface WillwiDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'willwi-music-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WillwiDB>> | undefined;

const DEBUG = import.meta.env.DEV; // Enable debug logging in development mode only

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DB Service]', ...args);
  }
};

export const initDB = async () => {
  if (!dbPromise) {
    try {
      log('Initializing IndexedDB...');
      
      // Check if IndexedDB is supported
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB is not supported in this browser');
      }

      dbPromise = openDB<WillwiDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          log('Upgrading database schema...');
          if (!db.objectStoreNames.contains('songs')) {
            const store = db.createObjectStore('songs', { keyPath: 'id' });
            store.createIndex('by-date', 'releaseDate');
            log('Created songs object store with by-date index');
          }
        },
      });

      const db = await dbPromise;
      log('IndexedDB initialized successfully');
      return db;
    } catch (error) {
      console.error('[DB Service] Failed to initialize IndexedDB:', error);
      dbPromise = undefined; // Reset promise so it can be retried
      throw error;
    }
  }
  return await dbPromise;
};

export const dbService = {
  async getAllSongs(): Promise<Song[]> {
    try {
      log('Fetching all songs from IndexedDB...');
      const db = await initDB();
      const songs = await db.getAll('songs');
      log(`Retrieved ${songs.length} songs from IndexedDB`);
      return songs;
    } catch (error) {
      console.error('[DB Service] Failed to get all songs:', error);
      throw error;
    }
  },

  async getSong(id: string): Promise<Song | undefined> {
    try {
      log(`Fetching song with id: ${id}`);
      const db = await initDB();
      const song = await db.get('songs', id);
      log(song ? 'Song found' : 'Song not found');
      return song;
    } catch (error) {
      console.error(`[DB Service] Failed to get song ${id}:`, error);
      throw error;
    }
  },

  async addSong(song: Song): Promise<void> {
    try {
      log(`Adding song: ${song.title}`);
      const db = await initDB();
      await db.put('songs', song);
      log('Song added successfully');
    } catch (error) {
      console.error('[DB Service] Failed to add song:', error);
      throw error;
    }
  },

  async updateSong(song: Song): Promise<void> {
    try {
      log(`Updating song: ${song.title}`);
      const db = await initDB();
      await db.put('songs', song);
      log('Song updated successfully');
    } catch (error) {
      console.error('[DB Service] Failed to update song:', error);
      throw error;
    }
  },

  async deleteSong(id: string): Promise<void> {
    try {
      log(`Deleting song with id: ${id}`);
      const db = await initDB();
      await db.delete('songs', id);
      log('Song deleted successfully');
    } catch (error) {
      console.error('[DB Service] Failed to delete song:', error);
      throw error;
    }
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    try {
      log(`Bulk adding ${songs.length} songs...`);
      const db = await initDB();
      const tx = db.transaction('songs', 'readwrite');
      await Promise.all(songs.map(song => tx.store.put(song)));
      await tx.done;
      log(`Successfully added ${songs.length} songs in bulk`);
    } catch (error) {
      console.error('[DB Service] Failed to bulk add songs:', error);
      throw error;
    }
  },

  async clearAllSongs(): Promise<void> {
    try {
      log('Clearing all songs from IndexedDB...');
      const db = await initDB();
      await db.clear('songs');
      log('All songs cleared successfully');
    } catch (error) {
      console.error('[DB Service] Failed to clear all songs:', error);
      throw error;
    }
  }
};