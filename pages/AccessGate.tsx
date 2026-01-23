import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyAccessCode, setAccessVerified, getAccessStatus } from '../services/accessService';

const AccessGate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 從 URL 取得目標頁面
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirect') || '/interactive';
  const songId = params.get('song') || '';
  
  // 檢查是否已驗證
  useEffect(() => {
    const status = getAccessStatus();
    if (status.verified) {
      // 已驗證，直接跳轉
      if (songId) {
        navigate(`/lyrics/${songId}`);
      } else {
        navigate(redirectTo);
      }
    }
  }, [navigate, redirectTo, songId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    
    try {
      const result = await verifyAccessCode(code.trim().toUpperCase());
      
      if (result.valid) {
        setAccessVerified(code, result.productId || '');
        // 跳轉到目標頁面
        if (songId) {
          navigate(`/lyrics/${songId}`);
        } else {
          navigate(redirectTo);
        }
      } else {
        setError(result.error || '驗證失敗，請確認您的存取碼');
      }
    } catch (e) {
      setError('系統錯誤，請稍後再試');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">WILLWI</h1>
          <p className="text-slate-400 text-sm">手工歌詞製作體驗</p>
        </div>
        
        {/* Gate Card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30">
              <svg className="w-8 h-8 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">輸入存取碼</h2>
            <p className="text-slate-400 text-sm">
              完成付款後，您會收到一組專屬存取碼
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="請輸入存取碼"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-lg tracking-widest font-mono placeholder:text-slate-500 focus:outline-none focus:border-brand-gold transition-colors"
                maxLength={12}
                autoComplete="off"
              />
            </div>
            
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={!code.trim() || isVerifying}
              className="w-full py-3 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '驗證中...' : '進入體驗'}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center mb-4">
              還沒有存取碼？
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              前往購買方案
            </button>
          </div>
        </div>
        
        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-600 text-xs">
            存取碼有效期限為 24 小時<br/>
            如有問題請聯繫 LINE@ 官方帳號
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
