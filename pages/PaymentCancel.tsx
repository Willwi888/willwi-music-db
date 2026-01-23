import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-lg w-full shadow-2xl text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-600">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">
          付款已取消
        </h1>
        
        <p className="text-slate-300 mb-2">
          您已取消本次付款。
        </p>
        
        <p className="text-slate-500 text-sm mb-8">
          如有任何問題，歡迎隨時與我們聯繫。
        </p>

        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full py-4 bg-brand-accent text-brand-darker font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide"
          >
            返回首頁
          </Link>
          
          <a 
            href="mailto:will@willwi.com" 
            className="block w-full py-4 border border-slate-700 text-slate-300 font-bold rounded-lg hover:border-brand-accent hover:text-brand-accent transition-colors uppercase tracking-wide"
          >
            聯繫客服
          </a>
        </div>

        <p className="text-slate-600 text-xs mt-8">
          您的購物車內容不會遺失，可隨時重新結帳。
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
