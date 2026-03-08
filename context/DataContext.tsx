import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Song, Language, ProjectType, SongContextType } from '../types';
import { dbService } from '../services/db';

const DataContext = createContext<SongContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlayerEnabled, setIsPlayerEnabledState] = useState(true);
  const [interactiveOtp, setInteractiveOtpState] = useState('2026');
  const [latestVideoUrl, setLatestVideoUrlState] = useState('');
  const [countdownTargetDate, setCountdownTargetDateState] = useState('');

  // Initialize DB and Load Data from API
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          
          // Load settings
          if (data.settings) {
            setIsPlayerEnabledState(data.settings.isPlayerEnabled ?? true);
            setInteractiveOtpState(data.settings.interactiveOtp || '2026');
            setLatestVideoUrlState(data.settings.latestVideoUrl || '');
            setCountdownTargetDateState(data.settings.countdownTargetDate || '');
          }

          // Load songs
          let dbSongs = data.songs || [];
          
          // Sort by date descending
          const sorted = dbSongs.sort((a: Song, b: Song) => 
            new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
          );
          setSongs(sorted);
        }
      } catch (error) {
        console.error("Failed to load data from server:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initData();
  }, []);

  const updateServerSettings = async (newSettings: any) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error("Failed to update settings", e);
    }
  };

  const setIsPlayerEnabled = (enabled: boolean) => {
    setIsPlayerEnabledState(enabled);
    updateServerSettings({ isPlayerEnabled: enabled });
  };

  const setInteractiveOtp = (otp: string) => {
    setInteractiveOtpState(otp);
    updateServerSettings({ interactiveOtp: otp });
  };

  const setLatestVideoUrl = (url: string) => {
    setLatestVideoUrlState(url);
    updateServerSettings({ latestVideoUrl: url });
  };

  const setCountdownTargetDate = (date: string) => {
    setCountdownTargetDateState(date);
    updateServerSettings({ countdownTargetDate: date });
  };

  const addSong = async (song: Song): Promise<boolean> => {
    try {
      await dbService.addSong(song);
      setSongs(prev => [song, ...prev].sort((a, b) => 
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      ));
      return true;
    } catch (e) {
      console.error("DB Add Error:", e);
      return false;
    }
  };

  const updateSong = async (id: string, updatedFields: Partial<Song>): Promise<boolean> => {
    try {
      const currentSong = songs.find(s => s.id === id);
      if (!currentSong) return false;

      const updatedSong = { ...currentSong, ...updatedFields };
      await dbService.updateSong(updatedSong);
      
      setSongs(prev => prev.map(s => s.id === id ? updatedSong : s).sort((a, b) => 
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      ));
      return true;
    } catch (e) {
      console.error("DB Update Error:", e);
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
    <DataContext.Provider value={{ 
      songs, 
      addSong, 
      updateSong, 
      deleteSong, 
      getSong,
      isLoaded,
      isPlayerEnabled,
      setIsPlayerEnabled,
      interactiveOtp,
      setInteractiveOtp,
      latestVideoUrl,
      setLatestVideoUrl,
      countdownTargetDate,
      setCountdownTargetDate
    }}>
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
