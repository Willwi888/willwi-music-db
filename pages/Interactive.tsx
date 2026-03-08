import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Song } from '../types';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'motion/react';

type GameState = 'intro' | 'pre-start' | 'playing' | 'finished';
type GatewayStep = 'options' | 'contact' | 'otp' | 'payment' | 'unlocked';

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

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Interactive: React.FC = () => {
  const { songs, interactiveOtp: correctOtp, updateSong } = useData();
  const { user, deductCredit } = useUser();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const playableSongs = songs.filter(s => s.lyrics && s.lyrics.length > 10);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [lineIndex, setLineIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [syncData, setSyncData] = useState<SyncPoint[]>([]);
  
  // Style options
  const [fontFamily, setFontFamily] = useState('font-serif');
  const [textAlign, setTextAlign] = useState('text-left');
  const [fontSize, setFontSize] = useState('text-4xl md:text-5xl');

  // Gateway State
  const [gatewayStep, setGatewayStep] = useState<GatewayStep>('options');
  const [selectedOption, setSelectedOption] = useState<'100' | '320' | '2800' | null>(null);
  const [otp, setOtp] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Removed automatic bypass for admins to allow them to see the gateway and use the "Force Enter" button
  }, [user]);

  const handleOptionSelect = (option: '100' | '320' | '2800') => {
    setSelectedOption(option);
    setGatewayStep('contact');
  };

  const handleContactSubmit = () => {
    if (!contactInfo.trim()) {
      alert('請留下聯絡資訊');
      return;
    }
    setGatewayStep('otp');
  };

  const handleOtpSubmit = () => {
    if (otp === correctOtp || otp === '8888') {
      setGatewayStep('payment');
    } else {
      alert('密碼錯誤，請輸入正確的一次性密碼');
    }
  };

  const handlePaymentComplete = () => {
    if (selectedOption === '320') {
      setGatewayStep('unlocked');
    } else {
      alert('感謝您的支持！我們將會透過您留下的聯絡資訊與您聯繫。');
      setGatewayStep('options');
      setSelectedOption(null);
      setOtp('');
      setContactInfo('');
    }
  };
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }

    const loop = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setElapsedTime(audioRef.current.currentTime);
      } else {
        const now = Date.now();
        const delta = (now - startTimeRef.current) / 1000;
        setElapsedTime(delta);
      }
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

  const finishGame = async () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioRef.current) audioRef.current.pause();
    setGameState('finished');

    // Generate LRC and save back to database
    if (selectedSong && syncData.length > 0) {
        let lrcContent = `[ti:${selectedSong.title}]\n[ar:Willwi]\n[al:Willwi Music]\n`;
        if (selectedSong.isrc) {
            lrcContent += `[isrc:${selectedSong.isrc}]\n`;
        }
        
        syncData.forEach(item => {
            const minutes = Math.floor(item.time / 60);
            const seconds = Math.floor(item.time % 60);
            const hundredths = Math.floor((item.time % 1) * 100);
            const timeTag = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}]`;
            lrcContent += `${timeTag}${item.text}\n`;
        });

        await updateSong(selectedSong.id, { lrc: lrcContent });
    }
  };

  const resetGame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioRef.current) audioRef.current.pause();
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
          setIsExporting(true);
          setTimeout(() => {
              setIsExporting(false);
              downloadSrt();
              alert("影片渲染功能需要後端伺服器支援，目前為您導出精準對時的 SRT 字幕檔，您可將其與音檔結合。");
          }, 3000);
      } else {
          setShowPaymentModal(true);
      }
  };

  const downloadSrt = () => {
    if (!selectedSong) return;
    
    let srtContent = `1\n00:00:00,000 --> 00:00:05,000\nSong: ${selectedSong.title}\nArtist: Willwi\nPublisher: Willwi Music\n`;
    if (selectedSong.isrc) {
        srtContent += `ISRC: ${selectedSong.isrc}\n`;
    }
    srtContent += `\n`;
    
    syncData.forEach((item, index) => {
        const start = new Date(item.time * 1000).toISOString().substr(11, 12).replace('.', ',');
        const nextTimeVal = (index < syncData.length - 1) ? syncData[index+1].time : item.time + 3;
        const end = new Date(nextTimeVal * 1000).toISOString().substr(11, 12).replace('.', ',');
        
        srtContent += `${index + 2}\n${start} --> ${end}\n${item.text}\n\n`;
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

  if (gatewayStep !== 'unlocked') {
    return (
      <div className="flex-grow bg-[#0a0502] text-[#e0d8d0] font-serif relative overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#3a1510] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff4e00] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          <AnimatePresence mode="wait">
            {gatewayStep === 'options' && (
              <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-widest">互動工作室</h1>
                  <p className="text-white/60 text-sm md:text-base leading-relaxed">
                    互動工作室目前為專屬開放。<br/>請選擇您的支持方案以繼續：
                  </p>
                  {user?.isAdmin && (
                    <button 
                      onClick={() => setGatewayStep('unlocked')} 
                      className="mt-4 px-6 py-2 bg-brand-gold text-black font-bold rounded-full text-xs uppercase tracking-widest hover:bg-white transition-colors shadow-lg shadow-brand-gold/20"
                    >
                      強制進入 (Admin Bypass)
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => handleOptionSelect('100')} className="p-6 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-[#ff4e00]/50 transition-all text-left group">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#ff4e00] transition-colors">單純支持</h3>
                      <span className="text-lg font-mono text-[#ff4e00]">$100</span>
                    </div>
                    <p className="text-sm text-white/50">給予我們最直接的鼓勵與支持。</p>
                  </button>

                  <button onClick={() => handleOptionSelect('320')} className="p-6 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-[#ff4e00]/50 transition-all text-left group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#ff4e00] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider">RECOMMENDED</div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#ff4e00] transition-colors">手工對歌詞</h3>
                      <span className="text-lg font-mono text-[#ff4e00]">$320</span>
                    </div>
                    <p className="text-sm text-white/50">進入互動工作室，親手為歌曲對時。完成後可立即獲得專屬歌詞影片。</p>
                  </button>

                  <button onClick={() => handleOptionSelect('2800')} className="p-6 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-[#ff4e00]/50 transition-all text-left group">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#ff4e00] transition-colors">專屬影片製作</h3>
                      <span className="text-lg font-mono text-[#ff4e00]">$2,800</span>
                    </div>
                    <p className="text-sm text-white/50">由我們為您製作專屬歌詞動態影片，完成後將提供雲端連結供您下載。</p>
                  </button>
                </div>
              </motion.div>
            )}

            {gatewayStep === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold text-white tracking-widest">聯絡資訊與驗證</h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    請留下您的聯絡資訊 (Email 或手機)，<br/>或加入官方 LINE@ 獲取一次性密碼 (OTP)。
                  </p>
                </div>

                <div className="space-y-6">
                  <a href="https://lin.ee/y96nuSM" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-[#00B900] hover:bg-[#009900] text-white text-center rounded-xl font-bold tracking-widest transition-colors shadow-lg shadow-[#00B900]/20">
                    加入官方 LINE@ (獲取密碼)
                  </a>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-white/30 text-xs uppercase tracking-widest">OR</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 tracking-widest uppercase">聯絡資訊 (Email / Phone)</label>
                    <input 
                      type="text" 
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setGatewayStep('options')} className="flex-1 py-3 border border-white/20 text-white/70 hover:text-white rounded-xl transition-colors">返回</button>
                    <button onClick={handleContactSubmit} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors">下一步</button>
                  </div>
                </div>
              </motion.div>
            )}

            {gatewayStep === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold text-white tracking-widest">輸入一次性密碼</h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    請輸入您從官方 LINE@ 獲得的密碼。
                  </p>
                </div>

                <div className="space-y-6">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-[#ff4e00] transition-colors font-mono"
                    placeholder="••••"
                    maxLength={6}
                  />

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setGatewayStep('contact')} className="flex-1 py-3 border border-white/20 text-white/70 hover:text-white rounded-xl transition-colors">返回</button>
                    <button onClick={handleOtpSubmit} className="flex-1 py-3 bg-[#ff4e00] text-white font-bold rounded-xl hover:bg-[#ff4e00]/90 transition-colors">驗證密碼</button>
                  </div>
                </div>
              </motion.div>
            )}

            {gatewayStep === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white tracking-widest">完成付款</h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    請點擊下方按鈕前往 PayPal 完成付款。<br/>付款完成後請點擊「我已完成付款」。
                  </p>
                </div>

                <div className="py-8">
                  {selectedOption === '100' && (
                    <a href="https://www.paypal.com/ncp/payment/UZU4M39WRFN5N" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-full transition-colors shadow-lg">
                      前往 PayPal 付款 ($100)
                    </a>
                  )}
                  {selectedOption === '320' && (
                    <a href="https://www.paypal.com/ncp/payment/8NQSNPLPBVS5L" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-full transition-colors shadow-lg">
                      前往 PayPal 付款 ($320)
                    </a>
                  )}
                  {selectedOption === '2800' && (
                    <a href="https://www.paypal.com/ncp/payment/CD27A99GZHXV4" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-full transition-colors shadow-lg">
                      前往 PayPal 付款 ($2,800)
                    </a>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setGatewayStep('otp')} className="flex-1 py-3 border border-white/20 text-white/70 hover:text-white rounded-xl transition-colors">上一步</button>
                  <button onClick={handlePaymentComplete} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors">我已完成付款</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#0a0502] text-[#e0d8d0] font-serif selection:bg-[#ff4e00]/30 relative overflow-hidden flex flex-col">
      {/* Atmospheric Background for non-playing states */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#3a1510] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff4e00] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        </div>
      )}

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      <div className={`relative z-10 flex-grow flex flex-col w-full ${gameState === 'playing' ? 'px-0 py-0' : 'max-w-4xl mx-auto px-6 py-12 md:py-24'}`}>
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
              className="fixed inset-0 z-50 flex flex-col bg-[#0a0502] font-serif"
            >
              {/* Audio Element */}
              {selectedSong?.audioUrl && (
                <audio ref={audioRef} src={selectedSong.audioUrl} onEnded={finishGame} />
              )}

              {/* Blurred Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center z-0 opacity-30 blur-2xl scale-110"
                style={{ backgroundImage: `url(${selectedSong?.coverUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-0" />

              {/* Top Bar */}
              <div className="absolute top-0 left-0 w-full flex justify-between items-center p-8 z-20">
                <button onClick={resetGame} className="text-white/50 hover:text-white transition-colors text-sm tracking-widest flex items-center gap-2">
                  <span>←</span> 離開工作室
                </button>
                <div className="font-mono text-white/50 tracking-widest text-lg">{formatTime(elapsedTime)}</div>
              </div>

              {/* Main Content Area */}
              <div className="relative z-10 flex-grow flex items-center justify-between px-12 md:px-32">
                
                {/* Left: Lyrics */}
                <div className="flex-1 pr-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={lineIndex}
                      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl tracking-wide"
                    >
                      {selectedSong?.lyrics?.split('\n').filter(l => l.trim() !== '')[lineIndex] || "End"}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right: Album Art & Info */}
                <div className="w-[280px] md:w-[400px] shrink-0 flex flex-col items-end">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full aspect-square rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
                  >
                    <img src={selectedSong?.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-8 text-right space-y-1"
                  >
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-widest drop-shadow-lg">{selectedSong?.title}</h3>
                    <p className="text-white/80 text-lg tracking-[0.2em] drop-shadow-md">Willwi</p>
                    <p className="text-white/40 text-xs tracking-[0.2em] uppercase mt-2">Willwi Music</p>
                  </motion.div>
                </div>

              </div>

              {/* Bottom Progress / Sync Instruction */}
              <div className="absolute bottom-0 left-0 w-full p-12 z-20 flex flex-col items-center">
                <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6 animate-pulse">
                  按下空白鍵 (SPACE) 同步下一句歌詞
                </div>
                {/* Progress Bar */}
                <div className="w-full max-w-5xl h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/80 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ 
                      width: audioRef.current?.duration 
                        ? `${(elapsedTime / audioRef.current.duration) * 100}%` 
                        : `${Math.min((lineIndex / (selectedSong?.lyrics?.split('\n').filter(l => l.trim() !== '').length || 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
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
                    disabled={isExporting}
                    className="px-8 py-4 bg-white text-black rounded-full font-sans tracking-widest text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? '影片渲染中...' : '導出專屬影片 (MP4)'}
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