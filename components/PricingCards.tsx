import React, { useState } from 'react';
import { PRODUCTS, ProductId, redirectToCheckout } from '../services/stripeService';
import { useTranslation } from '../context/LanguageContext';


const PricingCards: React.FC = () => {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const [loadingProduct, setLoadingProduct] = useState<ProductId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<ProductId | null>(null);

  const handleStripePayment = async (productId: ProductId) => {
    setLoadingProduct(productId);
    setError(null);
    
    try {
      await redirectToCheckout(productId);
    } catch (err: any) {
      console.error('Stripe error:', err);
      // 如果 Stripe 失敗，顯示 PayPal 選項
      setError('Stripe 暫時無法使用，請使用 PayPal 付款');
      setShowPaymentOptions(productId);
      setLoadingProduct(null);
    }
  };

  const handlePayPalPayment = (productId: ProductId) => {
    const link = getPayPalLink(productId);
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  const handlePurchase = (productId: ProductId) => {
    // 直接顯示付款選項
    setShowPaymentOptions(productId);
    setError(null);
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
        <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/50 rounded-lg text-amber-400 text-sm text-center">
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

            {/* Payment Options or CTA Button */}
            {showPaymentOptions === product.id ? (
              <div className="space-y-3">
                {/* Stripe Button */}
                <button
                  onClick={() => handleStripePayment(product.id)}
                  disabled={loadingProduct !== null}
                  className="w-full py-3 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                      信用卡 / Apple Pay
                    </>
                  )}
                </button>

                {/* PayPal Button */}
                <button
                  onClick={() => handlePayPalPayment(product.id)}
                  className="w-full py-3 rounded-lg font-medium bg-[#0070ba] text-white hover:bg-[#003087] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082h-2.19c-1.717 0-3.146 1.27-3.402 2.904l-1.122 7.106-.322 2.039a.641.641 0 0 0 .633.74h4.606c.524 0 .968-.382 1.05-.9l.86-5.449c.082-.518.526-.9 1.05-.9h.663c4.298 0 7.664-1.746 8.647-6.797.396-2.037-.007-3.583-1.267-4.538z"/>
                  </svg>
                  PayPal
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setShowPaymentOptions(null)}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => handlePurchase(product.id)}
                disabled={loadingProduct !== null}
                className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle(index, product.highlight)}`}
              >
                {isEn ? product.buttonTextEn : product.buttonText}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment Info */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-xs">
          🔒 安全付款 · 支援 Stripe / PayPal / LINE Pay
        </p>
      </div>
    </div>
  );
};

export default PricingCards;
