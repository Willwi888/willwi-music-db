import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { dbService } from '../services/db';
import { Song } from '../types';
import { isAdminLoggedIn, adminLogin, adminLogout } from '../services/adminService';

const AdminDashboard: React.FC = () => {
  const { songs, refreshSongs } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState('');
  const [linePayQRCode, setLinePayQRCode] = useState<string>(localStorage.getItem('linePayQRCode') || '');
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  
  // 密碼驗證狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // 檢查登入狀態
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isAdminLoggedIn();
      setIsAuthenticated(loggedIn);
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  // 處理登入
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(password)) {
      setIsAuthenticated(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('密碼錯誤');
      setPassword('');
    }
  };

  // 處理登出
  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
  };

  // Project Links provided by user
  const PROJECT_LINKS = {
      drive: 'https://drive.google.com/drive/folders/1PmP_GB7etr45T_DwcZcLt45Om2RDqTNI?usp=drive_link',
      supabase: 'https://supabase.com/dashboard/project/rzxqseimxhbokrhcdjbi',
      vercel: 'https://vercel.com/willwi',
      live: 'https://willwi-music-db.vercel.app'
  };

  // 1. Calculate Catalog Health
  const totalSongs = songs.length;
  const missingISRC = songs.filter(s => !s.isrc).length;
  const missingLyrics = songs.filter(s => !s.lyrics || s.lyrics.length < 10).length;
  const hasMusicBrainz = songs.filter(s => s.musicBrainzId).length;

  // 2. Mock Data for "Business Intelligence"
  const mockRevenue = {
    dailyRevenueUSD: 500,
    dailyRevenueNTD: 16000, 
    hearts: 4500,
    downloads: 128
  };

  // --- Backup Functions ---
  const handleExport = async () => {
    try {
        const dataStr = JSON.stringify(songs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        const link = document.createElement('a');
        link.href = url;
        link.download = `willwi_legacy_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Export failed", e);
        alert("匯出失敗，請稍後再試。");
    }
  };

  const handleImportClick = () => {
      if (window.confirm("⚠️ 警告：匯入備份將會「覆蓋」目前所有的資料庫內容。\n\n請確認您選擇的備份檔案是最新的。\n確定要繼續嗎？")) {
          fileInputRef.current?.click();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setRestoreStatus('Reading file...');

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = event.target?.result as string;
              const parsedSongs = JSON.parse(json) as Song[];
              
              if (!Array.isArray(parsedSongs)) {
                  throw new Error("Invalid format");
              }

              setRestoreStatus(`Found ${parsedSongs.length} songs. Restoring...`);
              
              // 1. Clear existing DB
              await dbService.clearAllSongs();
              
              // 2. Add new songs
              await dbService.bulkAdd(parsedSongs);

              setRestoreStatus('Success! Reloading...');
              
              // Refresh data
              if (refreshSongs) {
                await refreshSongs();
              }
              
              setTimeout(() => {
                  window.location.reload();
              }, 1000);

          } catch (err) {
              console.error(err);
              setRestoreStatus('Error: Invalid Backup File');
              alert("匯入失敗：檔案格式錯誤。");
              setIsProcessing(false);
          }
      };
      reader.readAsText(file);
  };

  const openGoogleDrive = () => {
      window.open(PROJECT_LINKS.drive, '_blank');
  };

  // --- LINE Pay QR Code Functions ---
  const handleQRCodeUpload = () => {
    qrCodeInputRef.current?.click();
  };

  const handleQRCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setQrCodePreview(dataUrl);
      setLinePayQRCode(dataUrl);
      localStorage.setItem('linePayQRCode', dataUrl);
      alert('LINE Pay QR Code 已更新！');
    };
    reader.readAsDataURL(file);
  };

  const handleQRCodeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLinePayQRCode(url);
    localStorage.setItem('linePayQRCode', url);
  };

  // 載入中畫面
  if (isChecking) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="text-white">驗證中...</div>
      </div>
    );
  }

  // 未登入 - 顯示密碼輸入畫面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
                <span className="text-4xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
              <p className="text-slate-400 text-sm mt-2">請輸入管理員密碼</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-center text-lg tracking-widest"
                  autoFocus
                />
                {loginError && (
                  <p className="mt-2 text-red-400 text-sm text-center">{loginError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold/90 transition-colors"
              >
                進入後台
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-slate-500 text-sm hover:text-white transition-colors">
                ← 返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登入 - 顯示後台
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Manager Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Willwi's Legacy Archive & Performance</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]"></span>
               <span className="text-xs text-brand-accent font-mono uppercase font-bold">Virtual Manager: Active</span>
             </div>
             <button
               onClick={handleLogout}
               className="px-3 py-1 text-xs text-slate-400 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition-colors"
             >
               登出
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: Legacy Archive & Carrd Guide */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* 1. CLOUD SYNC CENTER (Google Drive) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 bg-brand-gold text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl shadow-lg uppercase tracking-wider">CRITICAL</div>
                 
                 <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    ☁️ Cloud Sync (Google Drive)
                 </h2>
                 <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
                    這是確保資料永久保存的唯一途徑。網站本身不儲存資料，資料在您的瀏覽器中。請定期下載 JSON 檔並上傳至 Google Drive 專屬金庫。
                 </p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div className="space-y-3">
                         <div className="flex items-center gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-accent text-brand-darker font-bold flex items-center justify-center text-xs">1</span>
                             <span className="text-white text-sm font-bold">匯出資料庫檔案</span>
                         </div>
                         <button 
                            onClick={handleExport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-700 hover:bg-white hover:text-slate-900 text-white font-bold rounded-lg transition-all border border-slate-600 group-hover:border-brand-accent"
                        >
                             <span>⬇️ 下載最新備份 (.json)</span>
                         </button>
                     </div>

                     <div className="space-y-3">
                         <div className="flex items-center gap-3">
                             <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-slate-900 font-bold flex items-center justify-center text-xs">2</span>
                             <span className="text-white text-sm font-bold">上傳至雲端金庫</span>
                         </div>
                         <button 
                            onClick={openGoogleDrive}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-green-500/20"
                        >
                            <span>↗️ 開啟 Google Drive</span>
                        </button>
                     </div>
                 </div>

                 {/* Restore Section */}
                 <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="text-xs text-slate-500">
                         換了新電腦或瀏覽器？請在此匯入之前的 JSON 檔案：
                     </div>
                     <div className="relative">
                        <button 
                            onClick={handleImportClick}
                            disabled={isProcessing}
                            className="text-xs text-brand-accent hover:text-white underline font-bold px-2 py-1"
                        >
                            🔄 從檔案還原資料庫
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                     </div>
                 </div>
                 {restoreStatus && <p className="mt-2 text-brand-gold font-mono text-xs text-right">{restoreStatus}</p>}
            </div>

            {/* 2. PAYMENT & QR CODE MANAGEMENT */}
            <div className="bg-gradient-to-r from-green-900/20 to-slate-900 border border-green-700/30 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl shadow-lg uppercase tracking-wider">PAYMENT</div>
                
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    💳 Payment & QR Code
                </h2>
                <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
                    管理您的付款方式。上傳 LINE Pay QR Code 讓用戶可以透過 LINE Pay 支持您。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LINE Pay QR Code Upload */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <span className="text-green-400">LINE</span> Pay QR Code
                        </h3>
                        
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            {(qrCodePreview || linePayQRCode) ? (
                                <div className="space-y-3">
                                    <img 
                                        src={qrCodePreview || linePayQRCode} 
                                        alt="LINE Pay QR Code" 
                                        className="w-full max-w-[200px] mx-auto rounded-lg"
                                    />
                                    <button
                                        onClick={handleQRCodeUpload}
                                        className="w-full py-2 text-xs text-slate-400 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                                    >
                                        更換 QR Code
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleQRCodeUpload}
                                    className="w-full py-8 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-white hover:border-green-500 transition-colors"
                                >
                                    <div className="text-3xl mb-2">📷</div>
                                    <div className="text-sm">點擊上傳 QR Code</div>
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={qrCodeInputRef} 
                                onChange={handleQRCodeChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        <div className="text-xs text-slate-500">
                            或貼上 QR Code 網址：
                        </div>
                        <input
                            type="text"
                            value={linePayQRCode.startsWith('data:') ? '' : linePayQRCode}
                            onChange={handleQRCodeUrlChange}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                        />
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-4">
                        <h3 className="text-white font-bold">付款方式狀態</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-300 text-sm">Stripe</span>
                                <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded">待設定</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-300 text-sm">PayPal</span>
                                <span className="text-xs px-2 py-1 bg-green-900/50 text-green-400 rounded">已啟用</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-300 text-sm">LINE Pay</span>
                                <span className={`text-xs px-2 py-1 rounded ${linePayQRCode ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {linePayQRCode ? '已設定' : '未設定'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CATALOG HEALTH */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">📊 Catalog Health</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-brand-accent">{totalSongs}</div>
                        <div className="text-xs text-slate-400 uppercase">Total Songs</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{missingISRC}</div>
                        <div className="text-xs text-slate-400 uppercase">Missing ISRC</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-400">{missingLyrics}</div>
                        <div className="text-xs text-slate-400 uppercase">Missing Lyrics</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{hasMusicBrainz}</div>
                        <div className="text-xs text-slate-400 uppercase">MusicBrainz</div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Link to="/database" className="text-sm text-brand-accent hover:text-white transition-colors">
                        查看完整目錄 →
                    </Link>
                </div>
            </div>

        </div>

        {/* COL 2: Performance & Quick Links */}
        <div className="space-y-8">
            
            {/* Performance Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-accent text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl shadow-lg uppercase tracking-wider">LIVE MONITOR</div>
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    🎯 Performance
                </h2>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-brand-gold/10 to-transparent border border-brand-gold/20 rounded-xl p-6 text-center">
                        <div className="text-xs text-brand-gold uppercase tracking-widest mb-2">Hearts / Support</div>
                        <div className="text-5xl font-black text-brand-gold">{mockRevenue.hearts.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-2">Connected Souls</div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                        <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Est. Daily Revenue</div>
                        <div className="text-3xl font-bold text-green-400">~ ${mockRevenue.dailyRevenueUSD} USD</div>
                        <div className="text-xs text-slate-500 mt-1">(Approx. NT$ {mockRevenue.dailyRevenueNTD.toLocaleString()})</div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">🔗 Quick Links</h2>
                <div className="space-y-2">
                    <a href={PROJECT_LINKS.supabase} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors group">
                        <span className="text-slate-300 text-sm">Supabase Dashboard</span>
                        <span className="text-slate-500 group-hover:text-white">↗</span>
                    </a>
                    <a href={PROJECT_LINKS.vercel} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors group">
                        <span className="text-slate-300 text-sm">Vercel Dashboard</span>
                        <span className="text-slate-500 group-hover:text-white">↗</span>
                    </a>
                    <a href={PROJECT_LINKS.drive} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors group">
                        <span className="text-slate-300 text-sm">Google Drive Vault</span>
                        <span className="text-slate-500 group-hover:text-white">↗</span>
                    </a>
                    <Link to="/add" className="flex items-center justify-between p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-lg hover:bg-brand-accent/20 transition-colors group">
                        <span className="text-brand-accent text-sm font-bold">+ Add New Song</span>
                        <span className="text-brand-accent">→</span>
                    </Link>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
