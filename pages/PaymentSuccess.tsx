import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-lg w-full shadow-2xl text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">
          付款成功
        </h1>
        
        <p className="text-slate-300 mb-2">
          感謝您的支持！您的付款已成功處理。
        </p>
        
        <p className="text-slate-500 text-sm mb-8">
          我們將盡快與您聯繫，提供後續服務。
        </p>

        {sessionId && (
          <div className="bg-slate-950 rounded-lg p-4 mb-8 border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">交易編號</p>
            <p className="text-brand-accent font-mono text-sm break-all">{sessionId}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full py-4 bg-brand-accent text-brand-darker font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide"
          >
            返回首頁
          </Link>
          
          <Link 
            to="/interactive" 
            className="block w-full py-4 border border-slate-700 text-slate-300 font-bold rounded-lg hover:border-brand-accent hover:text-brand-accent transition-colors uppercase tracking-wide"
          >
            前往互動工作室
          </Link>
        </div>

        <p className="text-slate-600 text-xs mt-8">
          {countdown > 0 ? `${countdown} 秒後自動返回首頁` : '正在返回...'}
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
