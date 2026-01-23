import React, { useState, useRef, useEffect } from 'react';

interface SpotifyPreviewProps {
  spotifyId?: string;
  previewUrl?: string;
  coverUrl?: string;
  title?: string;
}

// Spotify 30秒試聽元件
const SpotifyPreview: React.FC<SpotifyPreviewProps> = ({ 
  spotifyId, 
  previewUrl,
  coverUrl,
  title 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasPreview, setHasPreview] = useState(false);
  
  // Spotify Preview URL 格式
  // 通常從 Spotify API 取得，格式如：https://p.scdn.co/mp3-preview/...
  const audioUrl = previewUrl || (spotifyId ? `https://p.scdn.co/mp3-preview/${spotifyId}` : '');
  
  useEffect(() => {
    // 檢查是否有可用的預覽
    if (audioUrl) {
      setHasPreview(true);
    }
  }, [audioUrl]);
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setHasPreview(false);
      });
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
    }
  };
  
  if (!hasPreview && !spotifyId) {
    return null;
  }
  
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-4">
        {/* Mini Cover */}
        {coverUrl && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Play Button & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!hasPreview}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                hasPreview 
                  ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {title || '試聽'}
              </p>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                30 秒試聽
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {isPlaying && (
            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1DB954] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        onError={() => setHasPreview(false)}
      />
      
      {!hasPreview && (
        <p className="text-slate-500 text-xs mt-2 text-center">
          此歌曲暫無試聽
        </p>
      )}
    </div>
  );
};

export default SpotifyPreview;
