// Payment Configuration
// PayPal Client ID (same for all buttons)
export const PAYPAL_CLIENT_ID = 'BAAJdKn38OBaweerVzsEy0F';

// Payment Plans
export const PAYMENT_PLANS = {
  // NT$100 - 音樂食糧 (純粹支持)
  support: {
    id: 'support',
    name: '音樂食糧',
    nameEn: 'Music Nourishment',
    price: 100,
    currency: 'TWD',
    description: '純粹支持',
    descriptionEn: 'Pure Support',
    features: [
      '贊助一頓飯錢',
      '延續創作能量',
      '直接挹注貢獻'
    ],
    featuresEn: [
      'Sponsor a meal',
      'Sustain creative energy',
      'Direct contribution'
    ],
    paypalButtonId: '8NQSNPLPBVS5L',
    stripeProductId: '', // To be configured
    hasAccess: false, // No feature access, just support
  },
  
  // NT$320 - 共鳴同步 (手工歌詞製作體驗)
  sync: {
    id: 'sync',
    name: '共鳴同步',
    nameEn: 'Resonance Sync',
    price: 320,
    currency: 'TWD',
    description: '手工歌詞製作體驗',
    descriptionEn: 'Handmade Lyrics Experience',
    features: [
      '單次創作參與權限',
      '手工互動體驗',
      '數位參與證書'
    ],
    featuresEn: [
      'Single creation access',
      'Handmade interactive experience',
      'Digital participation certificate'
    ],
    paypalButtonId: 'UZU4M39WRFN5N',
    stripeProductId: '', // To be configured
    hasAccess: true,
    accessType: 'interactive', // Access to interactive lyrics sync
  },
  
  // NT$2,800 - 雲端影院 (雲端高畫質製作)
  premium: {
    id: 'premium',
    name: '雲端影院',
    nameEn: 'Cloud Cinema',
    price: 2800,
    currency: 'TWD',
    description: '雲端高畫質製作',
    descriptionEn: 'Cloud HD Production',
    features: [
      '4K 高畫質重製',
      '無損音質整合',
      '數位親筆簽名'
    ],
    featuresEn: [
      '4K HD remaster',
      'Lossless audio integration',
      'Digital signature'
    ],
    paypalButtonId: 'CD27A99GZHXV4',
    stripeProductId: '', // To be configured
    hasAccess: true,
    accessType: 'premium', // Full access + cloud video generation
  }
};

// PayPal SDK URL
export const getPayPalSDKUrl = () => 
  `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=TWD`;

// PayPal Button IDs mapping
export const PAYPAL_BUTTONS: Record<string, string> = {
  support: '8NQSNPLPBVS5L',
  resonance: 'UZU4M39WRFN5N',
  cinema: 'CD27A99GZHXV4'
};

// LINE Pay QR Code (can be updated from admin)
export const LINE_PAY_QR_KEY = 'linepay_qr_url';
