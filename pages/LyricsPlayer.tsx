import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getAccessStatus } from '../services/accessService';
import { isAdminLoggedIn } from '../services/adminService';

interface LyricLine {
  time: number; // in seconds
  text: string;
}

// Parse LRC format lyrics or simple text lyrics
function parseLyrics(lyricsText: string): LyricLine[] {
  if (!lyricsText) return [];
  
  const lines = lyricsText.split('\n').filter(line => line.trim());
  const result: LyricLine[] = [];
  
  // Check if it's LRC format (has timestamps like [00:12.34])
  const lrcPattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  lines.forEach((line, index) => {
    const match = line.match(lrcPattern);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = minutes * 60 + seconds + ms / (match[3].length === 2 ? 100 : 1000);
      const text = line.replace(lrcPattern, '').trim();
      if (text) {
        result.push({ time, text });
      }
    } else {
      // Plain text - assign estimated time based on line position
      result.push({ time: index * 4, text: line.trim() });
    }
  });
  
  return result.sort((a, b) => a.time - b.time);
}

// Convert Dropbox share link to direct download link
function convertDropboxUrl(url: string): string {
  if (!url) return '';
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
              .replace('?dl=0', '')
              .replace('?dl=1', '');
  }
  return url;
}

const LyricsPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSong } = useData();
  const song = getSong(id || '');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [showCredits, setShowCredits] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // 檢查付費授權（管理員自動通過）
  useEffect(() => {
    // 管理員直接通過
    if (isAdminLoggedIn()) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }
    
    // 一般用戶檢查付費狀態
    const status = getAccessStatus();
    if (status.verified) {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, []);
  
  // Parse lyrics when song changes
  useEffect(() => {
    if (song?.lyrics) {
      setLyrics(parseLyrics(song.lyrics));
    }
  }, [song?.lyrics]);
  
  // Find current lyric line based on playback time
  useEffect(() => {
    if (lyrics.length === 0) return;
    
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    
    if (index !== currentLineIndex) {
      setCurrentLineIndex(index);
    }
  }, [currentTime, lyrics, currentLineIndex]);
  
  // Auto-scroll to current lyric
  useEffect(() => {
    if (currentLineIndex >= 0 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeElement = container.querySelector(`[data-index="${currentLineIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentLineIndex]);
  
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);
  
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 載入中
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">驗證中...</div>
      </div>
    );
  }
  
  // 未授權 - 導向付費牆
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
            <svg className="w-10 h-10 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">需要存取權限</h2>
          <p className="text-slate-400 mb-8">
            完整的動態歌詞體驗需要付費支持後才能進入。<br/>
            這是對創作者時間與心血的尊重。
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/access?song=${id}`)}
              className="w-full py-3 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold/90 transition-colors"
            >
              輸入存取碼
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              購買方案
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!song) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">找不到這首歌</p>
          <button 
            onClick={() => navigate('/database')}
            className="text-brand-accent hover:underline"
          >
            返回作品庫
          </button>
        </div>
      </div>
    );
  }
  
  const audioUrl = convertDropboxUrl(song.audioUrl || song.customAudioLink || '');
  
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background - Album Cover with blur */}
      <div className="absolute inset-0 z-0">
        <img 
          src={song.coverUrl} 
          alt="" 
          className="w-full h-full object-cover scale-110 blur-3xl opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden md:inline">返回</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-full border border-brand-gold/30">
              已授權
            </span>
            <button
              onClick={() => setShowCredits(!showCredits)}
              className="text-white/60 hover:text-white transition-colors text-sm"
            >
              {showCredits ? '歌詞' : '製作資訊'}
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
          {/* Album Cover */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl mb-8 ring-1 ring-white/10">
            <img 
              src={song.coverUrl} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Song Info */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{song.title}</h1>
            <p className="text-white/60">Willwi 陳威兒</p>
          </div>
          
          {/* Lyrics / Credits Display */}
          <div 
            ref={lyricsContainerRef}
            className="w-full max-w-2xl h-64 overflow-y-auto scrollbar-hide"
          >
            {showCredits ? (
              <div className="text-center space-y-2 text-white/70 text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {song.credits || `© 2026 Willwi Music
℗ 2026 Willwi Music

Main Artist : Willwi 陳威兒
Producer : Will Chen
Recording Engineer | Will Chen
Mixing Engineer | Will Chen
Mastering Engineer | Will Chen
Recording Studio | Willwi Studio, Taipei
Label | Willwi Music`}
                </pre>
              </div>
            ) : (
              <div className="space-y-4 py-8">
                {lyrics.length > 0 ? (
                  lyrics.map((line, index) => (
                    <p
                      key={index}
                      data-index={index}
                      className={`text-center text-xl md:text-2xl transition-all duration-500 cursor-pointer hover:text-white/80 ${
                        index === currentLineIndex
                          ? 'text-white font-bold scale-105 text-shadow-glow'
                          : index < currentLineIndex
                          ? 'text-white/30'
                          : 'text-white/50'
                      }`}
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = line.time;
                          setCurrentTime(line.time);
                        }
                      }}
                    >
                      {line.text}
                    </p>
                  ))
                ) : (
                  <p className="text-center text-white/50 text-lg">
                    暫無歌詞
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Player Controls - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-6 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white/60 text-xs w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <span className="text-white/60 text-xs w-10">{formatTime(duration)}</span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(0, currentTime - 10);
                  }
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                  }
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* No Audio Warning */}
      {!audioUrl && (
        <div className="fixed bottom-32 left-0 right-0 text-center">
          <p className="text-yellow-500 text-sm bg-yellow-500/10 inline-block px-4 py-2 rounded-full">
            此歌曲尚未設定音源連結
          </p>
        </div>
      )}
      
      {/* 金色簽名浮水印 - 右下角 */}
      <div className="fixed bottom-24 right-4 md:right-8 z-20 opacity-60 hover:opacity-100 transition-opacity">
        <img 
          src="/images/signature-gold.png" 
          alt="Willwi Signature" 
          className="h-8 md:h-12 w-auto"
        />
      </div>
      
      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </div>
  );
};

export default LyricsPlayer;
