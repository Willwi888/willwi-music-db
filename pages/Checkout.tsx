import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PAYMENT_PLANS } from '../constants/payment';
import PayPalButton from '../components/PayPalButton';

type PaymentMethod = 'paypal' | 'stripe' | 'linepay';

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'sync';
  const plan = PAYMENT_PLANS[planId as keyof typeof PAYMENT_PLANS] || PAYMENT_PLANS.sync;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          currency: 'twd'
        })
      });
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('付款處理失敗，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Generate access code and redirect to success page
    navigate('/payment-success?plan=' + plan.id);
  };

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">訂單摘要</h2>
            
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center border border-brand-gold/20">
                  <span className="text-2xl">✦</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">總計</span>
                  <span className="text-2xl font-bold text-white">
                    NT$ {plan.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                安全加密
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                付款保障
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">選擇付款方式</h2>
            
            <div className="space-y-3 mb-8">
              {/* PayPal */}
              <button
                onClick={() => setSelectedMethod('paypal')}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  selectedMethod === 'paypal'
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'paypal' ? 'border-brand-gold' : 'border-slate-600'
                }`}>
                  {selectedMethod === 'paypal' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-gold"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">PayPal</div>
                  <div className="text-xs text-slate-400">信用卡 / 金融卡 / PayPal 餘額</div>
                </div>
                <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6" />
              </button>

              {/* Stripe */}
              <button
                onClick={() => setSelectedMethod('stripe')}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  selectedMethod === 'stripe'
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'border-brand-gold' : 'border-slate-600'
                }`}>
                  {selectedMethod === 'stripe' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-gold"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">信用卡</div>
                  <div className="text-xs text-slate-400">Visa / Mastercard / JCB / Apple Pay</div>
                </div>
                <div className="flex gap-1">
                  <img src="https://cdn.jsdelivr.net/gh/nicepkg/nice-cdn@master/icons/visa.svg" alt="Visa" className="h-6" />
                  <img src="https://cdn.jsdelivr.net/gh/nicepkg/nice-cdn@master/icons/mastercard.svg" alt="Mastercard" className="h-6" />
                </div>
              </button>

              {/* LINE Pay */}
              <button
                onClick={() => setSelectedMethod('linepay')}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  selectedMethod === 'linepay'
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'linepay' ? 'border-brand-gold' : 'border-slate-600'
                }`}>
                  {selectedMethod === 'linepay' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-gold"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">LINE Pay</div>
                  <div className="text-xs text-slate-400">掃描 QR Code 付款</div>
                </div>
                <div className="w-8 h-8 bg-[#00B900] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">LINE</span>
                </div>
              </button>
            </div>

            {/* Payment Action */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
              {selectedMethod === 'paypal' && (
                <div>
                  <p className="text-sm text-slate-400 mb-4 text-center">點擊下方按鈕完成 PayPal 付款</p>
                  <PayPalButton 
                    buttonId={plan.paypalButtonId} 
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              )}

              {selectedMethod === 'stripe' && (
                <div>
                  <p className="text-sm text-slate-400 mb-4 text-center">將跳轉至安全的 Stripe 結帳頁面</p>
                  <button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-brand-gold text-black font-bold rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '處理中...' : `使用信用卡支付 NT$ ${plan.price.toLocaleString()}`}
                  </button>
                </div>
              )}

              {selectedMethod === 'linepay' && (
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-4">使用 LINE 掃描下方 QR Code</p>
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    {/* QR Code placeholder - will be loaded from admin settings */}
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                      QR Code
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    付款完成後，請將截圖傳送至官方 LINE@<br/>
                    我們將在確認後發送存取碼
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <p className="mt-6 text-xs text-slate-500 text-center">
              完成付款即表示您同意我們的服務條款。<br/>
              歌曲與歌詞的權利仍屬原創者所有。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
