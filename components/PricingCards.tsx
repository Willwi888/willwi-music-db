import React, { useState } from 'react';
import { PRODUCTS, ProductId, redirectToCheckout } from '../services/stripeService';
import { useTranslation } from '../context/LanguageContext';

const PricingCards: React.FC = () => {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const [loadingProduct, setLoadingProduct] = useState<ProductId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (productId: ProductId) => {
    setLoadingProduct(productId);
    setError(null);
    
    try {
      await redirectToCheckout(productId);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '付款處理失敗，請稍後再試');
      setLoadingProduct(null);
    }
  };

  const getCardStyle = (index: number, highlight?: boolean) => {
    if (highlight) {
      return 'border-brand-accent/50 bg-slate-900/80';
    }
    if (index === 0) {
      return 'border-brand-gold/30 bg-slate-900/60';
    }
    return 'border-slate-700/50 bg-slate-900/40';
  };

  const getButtonStyle = (index: number, highlight?: boolean) => {
    if (index === 0) {
      return 'bg-brand-gold text-brand-darker hover:bg-yellow-400';
    }
    if (highlight) {
      return 'bg-transparent border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-darker';
    }
    return 'bg-transparent border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white';
  };

  const getTitleColor = (index: number) => {
    if (index === 0) return 'text-brand-gold';
    if (index === 1) return 'text-brand-accent';
    return 'text-slate-300';
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PRODUCTS.map((product, index) => (
          <div
            key={product.id}
            className={`relative rounded-xl border backdrop-blur-sm p-6 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${getCardStyle(index, product.highlight)}`}
          >
            {/* Highlight Badge */}
            {product.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-brand-darker text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                典藏
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className={`text-lg font-bold uppercase tracking-wider mb-1 ${getTitleColor(index)}`}>
                {isEn ? product.nameEn : product.name}
              </h3>
              <p className="text-slate-400 text-sm">
                {isEn ? product.subtitleEn : product.subtitle}
              </p>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-4xl font-black text-white">
                NT$ {product.price.toLocaleString()}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-grow">
              {(isEn ? product.featuresEn : product.features).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-brand-gold mt-0.5">✦</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handlePurchase(product.id)}
              disabled={loadingProduct !== null}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle(index, product.highlight)}`}
            >
              {loadingProduct === product.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  處理中...
                </span>
              ) : (
                isEn ? product.buttonTextEn : product.buttonText
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Info */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-xs">
          🔒 安全付款由 Stripe 提供 · 支援信用卡 / Apple Pay / Google Pay
        </p>
      </div>
    </div>
  );
};

export default PricingCards;
