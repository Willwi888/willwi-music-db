import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Song } from '../types';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'motion/react';

type GameState = 'intro' | 'pre-start' | 'playing' | 'finished';

interface SyncPoint {
  time: number;
  text: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const Interactive: React.FC = () => {
  const { songs } = useData();
  const { user, deductCredit } = useUser();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const playableSongs = songs.filter(s => s.lyrics && s.lyrics.length > 10);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [lineIndex, setLineIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [syncData, setSyncData] = useState<SyncPoint[]>([]);
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setGameState('pre-start');
    setLineIndex(0);
    setElapsedTime(0);
    setSyncData([]);
  };

  const startGame = () => {
    if (!selectedSong) return;
    setGameState('playing');
    startTimeRef.current = Date.now();
    
    const loop = () => {
      const now = Date.now();
      const delta = (now - startTimeRef.current) / 1000;
      setElapsedTime(delta);
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const handleSync = () => {
    if (!selectedSong) return;
    
    const lyricsLines = selectedSong.lyrics!.split('\n').filter(l => l.trim() !== '');
    const currentLine = lyricsLines[lineIndex];

    const newSyncPoint = { time: elapsedTime, text: currentLine };
    setSyncData(prev => [...prev, newSyncPoint]);

    if (lineIndex < lyricsLines.length - 1) {
      setLineIndex(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setGameState('finished');
  };

  const resetGame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setGameState('intro');
    setSelectedSong(null);
    setLineIndex(0);
    setElapsedTime(0);
    setSyncData([]);
  };

  const handleDownloadClick = () => {
      if (!user) {
          alert("請先登入");
          return;
      }

      if (deductCredit()) {
          downloadSrt();
      } else {
          setShowPaymentModal(true);
      }
  };

  const downloadSrt = () => {
    if (!selectedSong) return;
    let srtContent = "";
    syncData.forEach((item, index) => {
        const start = new Date(item.time * 1000).toISOString().substr(11, 12).replace('.', ',');
        const nextTimeVal = (index < syncData.length - 1) ? syncData[index+1].time : item.time + 3;
        const end = new Date(nextTimeVal * 1000).toISOString().substr(11, 12).replace('.', ',');
        
        srtContent += `${index + 1}\n${start} --> ${end}\n${item.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSong.title}_handmade_lyrics.srt`;
    a.click();
    
    alert(`下載成功！已扣除 1 點額度。\n剩餘額度：${user?.credits}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleSync();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, lineIndex, elapsedTime]);

  return (
    <div className="flex-grow bg-[#0a0502] text-[#e0d8d0] font-serif selection:bg-[#ff4e00]/30 relative overflow-hidden flex flex-col">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#3a1510] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff4e00] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      <div className="relative z-10 flex-grow flex flex-col max-w-4xl mx-auto w-full px-6 py-12 md:py-24">
        <AnimatePresence mode="wait">
          
          {/* 1. Intro View */}
          {gameState === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-16"
            >
              <div className="space-y-8 max-w-lg">
                <h1 className="text-sm tracking-[0.3em] uppercase text-[#ff4e00]/80 font-sans">存在宣言</h1>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed font-light text-white/80">
                  <p>我不是在做一個工具。<br/>我是在留一個地方。</p>
                  <p>這裡不是音樂平台也不是用來被比較<br/>被評分被消耗的地方</p>
                  <p>歌詞必須手工對時，不是因為我做不到自動化<br/>而是因為一首歌值得被人坐下來陪完</p>
                  <p>不是為了被記得，而是為了記得。<br/>我不等誰回來。我只是留一盞燈。<br/>讓記憶裡的那個人，有一個地方可以站著。</p>
                </div>
              </div>

              <div className="w-full max-w-2xl pt-12 border-t border-white/10">
                <h2 className="text-xs tracking-[0.2em] uppercase text-white/40 mb-8 font-sans">選擇一首歌，留下來陪它</h2>
                {playableSongs.length === 0 ? (
                  <p className="text-white/40 text-sm">目前沒有可陪伴的歌曲。</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {playableSongs.map(song => (
                      <button 
                        key={song.id} 
                        onClick={() => handleSelectSong(song)}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-500 backdrop-blur-sm"
                      >
                        <h3 className="text-xl font-medium text-white group-hover:text-[#ff4e00] transition-colors">{song.title}</h3>
                        <p className="text-white/40 text-sm mt-2 font-sans">{song.versionLabel || song.language}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 2. Pre-start View */}
          {gameState === 'pre-start' && (
            <motion.div 
              key="pre-start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center flex-grow text-center space-y-12"
            >
              <div className="space-y-8 max-w-lg">
                <h2 className="text-sm tracking-[0.3em] uppercase text-[#ff4e00]/80 font-sans">開始之前</h2>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed font-light text-white/80">
                  <p>在你開始之前，我想先說一件事。</p>
                  <p>接下來的時間，沒有再來一次，沒有修到完美。<br/>你會慢一點，快一點，有些地方對不準，有些地方會歪。</p>
                  <p>那是你真的在這首歌裡的證據。</p>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-transparent border border-white/20 hover:border-white/60 text-white rounded-full transition-all duration-500 hover:bg-white hover:text-black font-sans tracking-widest text-sm"
              >
                如果你準備好了，我們就開始
              </button>
              
              <button 
                onClick={resetGame}
                className="text-white/30 hover:text-white/60 text-xs font-sans tracking-widest transition-colors"
              >
                返回
              </button>
            </motion.div>
          )}

          {/* 3. Playing View */}
          {gameState === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col flex-grow relative"
            >
              <div className="absolute top-0 left-0 w-full flex justify-between items-center text-white/30 font-sans text-xs tracking-widest">
                <button onClick={resetGame} className="hover:text-white transition-colors">← 離開</button>
                <div className="font-mono">{formatTime(elapsedTime)}</div>
              </div>

              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-16 mt-12">
                <div className="text-white/40 text-sm md:text-base font-light tracking-wide max-w-md">
                  <p>你不需要急這首歌不會走。</p>
                  <p>跟著它在你覺得「對了」的時候，輕輕按下空白鍵結束放開。</p>
                  <p>每一行歌詞，都是你親手放上去的。</p>
                </div>

                <div className="w-full max-w-2xl relative h-40 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={lineIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl md:text-4xl font-medium text-white leading-relaxed"
                    >
                      {selectedSong?.lyrics?.split('\n').filter(l => l.trim() !== '')[lineIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleSync}
                  className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center text-white/30 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all duration-300 font-sans text-xs tracking-widest active:scale-95 active:bg-white/20"
                >
                  SPACE
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. Finished View */}
          {gameState === 'finished' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center text-center space-y-16"
            >
              <div className="space-y-8 max-w-lg">
                <h2 className="text-sm tracking-[0.3em] uppercase text-[#ff4e00]/80 font-sans">完成後</h2>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed font-light text-white/80">
                  <p>這不是一個完美的版本。<br/>這是一個屬於你的版本。</p>
                  <p>你願意把它留下來真好。</p>
                </div>
              </div>

              <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-white/10 pt-12">
                <div className="space-y-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-white/40 font-sans">關於費用</h3>
                  <div className="text-sm text-white/60 leading-relaxed space-y-2">
                    <p>不是因為創作有價，而是因為時間有重量。</p>
                    <p>如果這個網站要存在、要被維護、要被好好對待，它必須被尊重。</p>
                    <p>你付費的不是功能，而是你願意為一首歌留下的時間。</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-white/40 font-sans">下載與權利說明</h3>
                  <div className="text-sm text-white/60 leading-relaxed space-y-2">
                    <p>你可以下載你完成的歌詞影片。<br/>那是你陪這首歌走過的紀錄。</p>
                    <p>但下載，不代表任何著作權轉移。<br/>歌曲、歌詞、錄音的權利，仍屬原創作者所有。</p>
                    <p>這裡不是授權平台，也不提供轉售、商用或二次授權。</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex flex-col items-center space-y-6">
                <p className="text-sm text-white/40">如果你理解這件事，你可以繼續。</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleDownloadClick}
                    className="px-8 py-4 bg-white text-black rounded-full font-sans tracking-widest text-sm hover:bg-white/90 transition-colors"
                  >
                    下載你的紀錄 (.SRT)
                  </button>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-4 border border-white/20 text-white rounded-full font-sans tracking-widest text-sm hover:bg-white/10 transition-colors"
                  >
                    回到起點
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Interactive;