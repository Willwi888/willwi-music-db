import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Song } from '../types';
import { getAccessStatus } from '../services/accessService';
import { isAdminLoggedIn } from '../services/adminService';
import { useNavigate } from 'react-router-dom';

// -------------------
// Types & Helpers
// -------------------
type StudioState = 'intro' | 'select' | 'ready' | 'playing' | 'finished';

interface SyncedLine {
  time: number;
  text: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Convert Dropbox share link to direct download link
const convertDropboxUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
              .replace('?dl=0', '')
              .replace('?dl=1', '');
  }
  return url;
};

// -------------------
// 宣言文案
// -------------------
const MANIFESTO = {
  intro: {
    title: '關於這裡',
    content: `這裡的歌詞需要手工對時
不是因為做不到自動
而是因為有些歌不該被自動完成
你必須坐下來陪它走一段`
  },
  before: {
    title: '開始前',
    content: `這裡沒有再來一次
也沒有修到完美
你現在做的就是最後的樣子

對歌詞的時候慢一點沒關係
你只是在找這一句應該落在哪裡`
  },
  after: {
    title: '完成後',
    content: `這是最好的版本
屬於你的版本
因為它是真的`
  },
  fee: {
    title: '關於費用',
    content: `不做免費的事
因為時間不是免費的`
  },
  download: {
    title: '下載說明',
    content: `你可以下載你完成的影片
那是你陪這首歌走過的紀錄`
  },
  rights: {
    title: '歌曲與歌詞的權利',
    content: `仍屬原創者
這裡不是授權
也不是買賣`
  },
  final: {
    title: '最後',
    content: `不打分數
每一個完成的版本
我都感謝`
  }
};

const Interactive: React.FC = () => {
  const { songs } = useData();
  const navigate = useNavigate();
  
  // Authorization check
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Filter songs that have lyrics AND audio
  const playableSongs = songs.filter(s => 
    s.lyrics && s.lyrics.length > 10 && 
    (s.audioUrl || s.customAudioLink)
  );
  
  // Studio state
  const [studioState, setStudioState] = useState<StudioState>('intro');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  
  // Lyrics & Sync
  const [lyricsLines, setLyricsLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  
  // Audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Canvas for recording
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Displayed lyrics (animated)
  const [displayedLines, setDisplayedLines] = useState<SyncedLine[]>([]);
  
  // Check authorization
  useEffect(() => {
    if (isAdminLoggedIn()) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }
    
    const status = getAccessStatus();
    if (status.verified) {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, []);
  
  // Parse lyrics when song selected
  useEffect(() => {
    if (selectedSong?.lyrics) {
      const lines = selectedSong.lyrics
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      setLyricsLines(lines);
    }
  }, [selectedSong]);
  
  // Audio time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);
  
  // Audio loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);
  
  // Audio ended
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    finishSession();
  }, []);
  
  // Select song
  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setCurrentLineIndex(0);
    setSyncedLines([]);
    setDisplayedLines([]);
    setStudioState('ready');
  };
  
  // Start session
  const startSession = () => {
    if (!audioRef.current) return;
    
    setStudioState('playing');
    setCurrentLineIndex(0);
    setSyncedLines([]);
    setDisplayedLines([]);
    
    // Start audio
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    
    // Start recording
    startRecording();
  };
  
  // Sync current line (user clicks or presses space)
  const syncCurrentLine = useCallback(() => {
    if (studioState !== 'playing' || currentLineIndex >= lyricsLines.length) return;
    
    const newSyncedLine: SyncedLine = {
      time: currentTime,
      text: lyricsLines[currentLineIndex]
    };
    
    setSyncedLines(prev => [...prev, newSyncedLine]);
    setDisplayedLines(prev => [...prev, newSyncedLine]);
    
    if (currentLineIndex < lyricsLines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      // All lines synced, wait for audio to end or user can finish early
    }
  }, [studioState, currentLineIndex, lyricsLines, currentTime]);
  
  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && studioState === 'playing') {
        e.preventDefault();
        syncCurrentLine();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studioState, syncCurrentLine]);
  
  // Finish session
  const finishSession = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    stopRecording();
    setStudioState('finished');
  };
  
  // Canvas recording functions
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    recordedChunksRef.current = [];
    
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Add audio track if available
    if (audioRef.current) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination); // Also play through speakers
      
      destination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100); // Collect data every 100ms
    setIsRecording(true);
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };
  
  // Download video
  const downloadVideo = () => {
    if (recordedChunksRef.current.length === 0) {
      alert('沒有錄製到影片');
      return;
    }
    
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSong?.title || 'lyrics'}_handmade_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Download SRT as backup
  const downloadSrt = () => {
    if (syncedLines.length === 0) return;
    
    let srtContent = "";
    syncedLines.forEach((item, index) => {
      const start = new Date(item.time * 1000).toISOString().substr(11, 12).replace('.', ',');
      const nextTime = (index < syncedLines.length - 1) ? syncedLines[index + 1].time : item.time + 3;
      const end = new Date(nextTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      srtContent += `${index + 1}\n${start} --> ${end}\n${item.text}\n\n`;
    });
    
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSong?.title || 'lyrics'}_handmade.srt`;
    a.click();
  };
  
  // Canvas rendering
  useEffect(() => {
    if (studioState !== 'playing' && studioState !== 'finished') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    const coverImage = new Image();
    coverImage.crossOrigin = 'anonymous';
    coverImage.src = selectedSong?.coverUrl || '';
    
    const signatureImage = new Image();
    signatureImage.src = '/images/signature-gold.png';
    
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw blurred cover as background
      if (coverImage.complete) {
        ctx.filter = 'blur(50px)';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(coverImage, -50, -50, canvas.width + 100, canvas.height + 100);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      }
      
      // Draw cover on right side
      if (coverImage.complete) {
        const coverSize = 300;
        const coverX = canvas.width - coverSize - 60;
        const coverY = (canvas.height - coverSize) / 2;
        
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 30;
        ctx.drawImage(coverImage, coverX, coverY, coverSize, coverSize);
        ctx.shadowBlur = 0;
      }
      
      // Draw lyrics on left side (Musixmatch style - from bottom to top)
      const lyricsX = 60;
      const lyricsMaxWidth = canvas.width - 500;
      const lineHeight = 60;
      const startY = canvas.height - 150;
      
      ctx.font = 'bold 36px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      
      // Show last 5 synced lines, newest at bottom
      const visibleLines = displayedLines.slice(-5);
      visibleLines.forEach((line, i) => {
        const y = startY - (visibleLines.length - 1 - i) * lineHeight;
        const isNewest = i === visibleLines.length - 1;
        
        ctx.fillStyle = isNewest ? '#fff' : 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(line.text, lyricsX, y, lyricsMaxWidth);
      });
      
      // Draw song title at top
      ctx.font = '24px "Noto Sans TC", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`${selectedSong?.title} - Willwi`, 60, 50);
      
      // Draw signature watermark at bottom right
      if (signatureImage.complete) {
        const sigHeight = 40;
        const sigWidth = sigHeight * (signatureImage.width / signatureImage.height);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(signatureImage, canvas.width - sigWidth - 30, canvas.height - sigHeight - 30, sigWidth, sigHeight);
        ctx.globalAlpha = 1;
      }
      
      // Draw time
      ctx.font = '18px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(`${formatTime(currentTime)} / ${formatTime(duration)}`, canvas.width - 30, 50);
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [studioState, selectedSong, displayedLines, currentTime, duration]);
  
  // Reset
  const resetSession = () => {
    setStudioState('select');
    setSelectedSong(null);
    setCurrentLineIndex(0);
    setSyncedLines([]);
    setDisplayedLines([]);
    setCurrentTime(0);
    setDuration(0);
  };
  
  // Loading
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">驗證中...</div>
      </div>
    );
  }
  
  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
            <svg className="w-10 h-10 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">手工對時工作室</h2>
          <p className="text-slate-400 mb-8">
            這裡需要付費支持後才能進入。<br/>
            因為時間不是免費的。
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/access')}
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
          </div>
        </div>
      </div>
    );
  }
  
  // Get audio URL
  const audioUrl = selectedSong ? convertDropboxUrl(selectedSong.audioUrl || selectedSong.customAudioLink || '') : '';
  
  // -------------------
  // Render Views
  // -------------------
  
  // Intro View - 宣言
  if (studioState === 'intro') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="space-y-12 text-center">
            {/* Main manifesto */}
            <div className="space-y-8">
              <h1 className="text-3xl md:text-4xl font-light tracking-wide text-brand-gold">
                {MANIFESTO.intro.title}
              </h1>
              <p className="text-xl md:text-2xl leading-relaxed text-white/80 whitespace-pre-line">
                {MANIFESTO.intro.content}
              </p>
            </div>
            
            <div className="h-px bg-white/10 w-32 mx-auto"></div>
            
            <div className="space-y-4">
              <p className="text-lg text-white/60 whitespace-pre-line">
                {MANIFESTO.before.content}
              </p>
            </div>
            
            <button
              onClick={() => setStudioState('select')}
              className="mt-12 px-12 py-4 border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-300 tracking-widest text-sm"
            >
              我準備好了
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Select View
  if (studioState === 'select') {
    return (
      <div className="min-h-screen bg-black text-white pb-12">
        <div className="max-w-6xl mx-auto px-4 pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">選擇一首歌</h1>
              <p className="text-white/50 text-sm mt-1">陪它走一段</p>
            </div>
            <button
              onClick={() => setStudioState('intro')}
              className="text-white/50 hover:text-white text-sm"
            >
              ← 返回
            </button>
          </div>
          
          {/* Song Grid */}
          {playableSongs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/50">目前沒有可用的歌曲</p>
              <p className="text-white/30 text-sm mt-2">需要有歌詞和音源連結</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playableSongs.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className="group relative bg-slate-900/50 rounded-lg overflow-hidden border border-white/5 hover:border-brand-gold/50 transition-all text-left"
                >
                  <div className="aspect-square relative">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white truncate">{song.title}</h3>
                      <p className="text-white/50 text-sm">{song.language}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Ready View
  if (studioState === 'ready') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Song Info */}
          <div className="mb-12">
            <img 
              src={selectedSong?.coverUrl}
              alt={selectedSong?.title}
              className="w-48 h-48 mx-auto rounded-lg shadow-2xl mb-6"
            />
            <h2 className="text-2xl font-bold">{selectedSong?.title}</h2>
            <p className="text-white/50">Willwi 陳威兒</p>
          </div>
          
          {/* Instructions */}
          <div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-brand-gold font-bold mb-4">開始前</h3>
            <p className="text-white/70 whitespace-pre-line text-sm leading-relaxed">
              {MANIFESTO.before.content}
            </p>
          </div>
          
          <div className="text-white/50 text-sm mb-8">
            <p>音樂會開始播放</p>
            <p>點擊畫面或按<span className="bg-white/10 px-2 py-1 rounded mx-1">空白鍵</span>標記歌詞</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={startSession}
              className="w-full py-4 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold/90 transition-colors"
            >
              開始
            </button>
            <button
              onClick={resetSession}
              className="w-full py-3 text-white/50 hover:text-white transition-colors"
            >
              選其他歌
            </button>
          </div>
        </div>
        
        {/* Hidden audio element for preloading */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          preload="auto"
        />
      </div>
    );
  }
  
  // Playing View
  if (studioState === 'playing') {
    const progress = lyricsLines.length > 0 ? (currentLineIndex / lyricsLines.length) * 100 : 0;
    const nextLine = currentLineIndex < lyricsLines.length ? lyricsLines[currentLineIndex] : null;
    
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Canvas for recording */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-[70vh] border border-white/10 rounded-lg"
        />
        
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Next line hint */}
            {nextLine && (
              <div className="text-center mb-6">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-2">下一句</p>
                <p className="text-white/70 text-lg">{nextLine}</p>
              </div>
            )}
            
            {/* Sync button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={syncCurrentLine}
                disabled={currentLineIndex >= lyricsLines.length}
                className="px-12 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="text-white font-bold">點擊標記</span>
                <span className="text-white/50 text-sm ml-2">(或按空白鍵)</span>
              </button>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white/50 text-sm w-16 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-gold transition-all duration-300"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                ></div>
              </div>
              <span className="text-white/50 text-sm w-16">{formatTime(duration)}</span>
            </div>
            
            {/* Line progress */}
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>歌詞進度: {currentLineIndex} / {lyricsLines.length}</span>
              <button
                onClick={finishSession}
                className="text-white/50 hover:text-white"
              >
                提前結束
              </button>
            </div>
          </div>
        </div>
        
        {/* Hidden audio */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
        />
      </div>
    );
  }
  
  // Finished View
  if (studioState === 'finished') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Completion message */}
          <div className="mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
              <svg className="w-10 h-10 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">{MANIFESTO.after.title}</h2>
            <p className="text-white/70 whitespace-pre-line">
              {MANIFESTO.after.content}
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-light text-brand-gold">{syncedLines.length}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest">行歌詞</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl font-light text-brand-gold">{formatTime(currentTime)}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest">時長</div>
            </div>
          </div>
          
          {/* Download info */}
          <div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-brand-gold font-bold mb-2">{MANIFESTO.download.title}</h3>
            <p className="text-white/60 text-sm whitespace-pre-line">
              {MANIFESTO.download.content}
            </p>
          </div>
          
          {/* Download buttons */}
          <div className="space-y-3">
            <button
              onClick={downloadVideo}
              className="w-full py-4 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold/90 transition-colors"
            >
              下載影片 (.webm)
            </button>
            <button
              onClick={downloadSrt}
              className="w-full py-3 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
            >
              下載字幕檔 (.srt)
            </button>
            <button
              onClick={resetSession}
              className="w-full py-3 text-white/50 hover:text-white transition-colors"
            >
              再做一首
            </button>
          </div>
          
          {/* Rights notice */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-white/30 text-xs whitespace-pre-line">
              {MANIFESTO.rights.content}
            </p>
            <p className="text-white/20 text-xs mt-4">
              {MANIFESTO.final.content}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default Interactive;
