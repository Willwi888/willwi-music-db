import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Song, Language, ProjectType, SongContextType } from '../types';
import { dbService } from '../services/db';

interface ExtendedSongContextType extends SongContextType {
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<ExtendedSongContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'willwi_music_db_v1';
const DEBUG = import.meta.env.DEV; // Enable debug logging in development mode only

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DataContext]', ...args);
  }
};

// Initial sample data if DB is completely empty and no local storage found
const INITIAL_DATA: Song[] = [
  {
    id: '1',
    title: '再愛一次',
    versionLabel: 'Original',
    coverUrl: 'https://picsum.photos/id/26/400/400',
    language: Language.Mandarin,
    projectType: ProjectType.Indie,
    releaseDate: '2023-10-15',
    isEditorPick: true,
    isrc: 'TW-A01-23-00001',
    spotifyId: '4uLU6hMCjMI75M1A2tKZBC', 
    lyrics: "走在 熟悉的街角\n回憶 像是海浪拍打\n每一個呼吸\n都是你的氣息\n再愛一次\n能不能\n再愛一次",
    description: "一首關於失去與重逢的抒情搖滾。",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
    musixmatchUrl: "https://www.musixmatch.com/artist/Willwi",
    youtubeMusicUrl: "https://music.youtube.com/channel/WillwiID",
    spotifyLink: "https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4",
    appleMusicLink: "https://music.apple.com/us/artist/willwi/1798471457"
  },
  {
    id: '2',
    title: '泡麵之歌',
    coverUrl: 'https://picsum.photos/id/192/400/400',
    language: Language.Japanese,
    projectType: ProjectType.PaoMien,
    releaseDate: '2024-01-20',
    isEditorPick: false,
    isrc: 'TW-A01-24-00002',
    description: "深夜肚子餓時的即興創作。",
    musixmatchUrl: "https://www.musixmatch.com/artist/Willwi",
    youtubeMusicUrl: "https://music.youtube.com/channel/WillwiID",
    spotifyLink: "https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4",
    appleMusicLink: "https://music.apple.com/us/artist/willwi/1798471457"
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize DB and Load Data
  useEffect(() => {
    const initData = async () => {
      log('Starting data initialization...');
      setIsLoading(true);
      setError(null);

      try {
        // 1. Try to fetch from IndexedDB
        log('Step 1: Attempting to fetch songs from IndexedDB...');
        let dbSongs: Song[] = [];
        
        try {
          dbSongs = await dbService.getAllSongs();
          log(`Successfully retrieved ${dbSongs.length} songs from IndexedDB`);
        } catch (dbError) {
          console.error('[DataContext] IndexedDB fetch failed:', dbError);
          log('IndexedDB is not available or blocked, will use fallback data');
          // Continue with empty array - will trigger migration or initial data
        }

        // 2. Check for migration: If DB is empty but LocalStorage has data
        if (dbSongs.length === 0) {
          log('Step 2: Database is empty, checking LocalStorage for migration...');
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          
          if (localData) {
            try {
              log("Found LocalStorage data, attempting migration...");
              const parsedLocal: Song[] = JSON.parse(localData);
              
              if (parsedLocal.length > 0) {
                log(`Migrating ${parsedLocal.length} songs from LocalStorage...`);
                
                try {
                  await dbService.bulkAdd(parsedLocal);
                  dbSongs = await dbService.getAllSongs();
                  log('Migration successful!');
                } catch (migrationError) {
                  console.error('[DataContext] Migration to IndexedDB failed:', migrationError);
                  log('Using LocalStorage data directly as fallback');
                  dbSongs = parsedLocal; // Use parsed data directly if DB fails
                }
                
                // Optional: Clear local storage after successful migration
                // localStorage.removeItem(LOCAL_STORAGE_KEY);
              }
            } catch (parseError) {
              console.error('[DataContext] Failed to parse LocalStorage data:', parseError);
              log('LocalStorage data is corrupted, will use initial sample data');
            }
          }
          
          // 3. If completely new, load initial sample data
          if (dbSongs.length === 0) {
            log("Step 3: No existing data found, initializing with sample data...");
            
            try {
              await dbService.bulkAdd(INITIAL_DATA);
              dbSongs = await dbService.getAllSongs();
              log('Sample data successfully added to IndexedDB');
            } catch (bulkAddError) {
              console.error('[DataContext] Failed to add sample data to IndexedDB:', bulkAddError);
              log('Using sample data in memory only');
              dbSongs = INITIAL_DATA; // Use initial data directly if DB fails
            }
          }
        }

        // Sort by date descending
        log('Sorting songs by release date...');
        const sorted = dbSongs.sort((a, b) => 
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
        
        setSongs(sorted);
        log(`✓ Initialization complete! ${sorted.length} songs loaded.`);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[DataContext] Critical initialization error:', err);
        setError(errorMessage);
        
        // Fallback to memory-only initial data
        log('⚠ Using fallback: Loading initial data in memory only');
        setSongs(INITIAL_DATA);
        
      } finally {
        setIsLoading(false);
        log('Data initialization finished');
      }
    };

    initData();
  }, []);

  const addSong = async (song: Song): Promise<boolean> => {
    try {
      await dbService.addSong(song);
      setSongs(prev => [song, ...prev]);
      return true;
    } catch (e) {
      console.error("DB Add Error:", e);
      alert("儲存失敗：資料庫寫入錯誤。");
      return false;
    }
  };

  const updateSong = async (id: string, updatedFields: Partial<Song>): Promise<boolean> => {
    try {
      const currentSong = songs.find(s => s.id === id);
      if (!currentSong) return false;

      const updatedSong = { ...currentSong, ...updatedFields };
      await dbService.updateSong(updatedSong);
      
      setSongs(prev => prev.map(s => s.id === id ? updatedSong : s));
      return true;
    } catch (e) {
      console.error("DB Update Error:", e);
      alert("更新失敗。");
      return false;
    }
  };

  const deleteSong = async (id: string) => {
    if (window.confirm("確定要刪除這首歌嗎？此操作無法復原。")) {
      try {
        await dbService.deleteSong(id);
        setSongs(prev => prev.filter(s => s.id !== id));
      } catch (e) {
        console.error("DB Delete Error:", e);
        alert("刪除失敗。");
      }
    }
  };

  const getSong = (id: string) => songs.find(s => s.id === id);

  return (
    <DataContext.Provider value={{ songs, addSong, updateSong, deleteSong, getSong, isLoading, error }}>
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