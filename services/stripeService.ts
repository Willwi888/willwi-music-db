// Stripe Checkout Service
// Handles communication with the backend API for payment processing

export type ProductId = 'resonance' | 'cinema' | 'support';

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface ProductInfo {
  id: ProductId;
  name: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  price: number;
  features: string[];
  featuresEn: string[];
  buttonText: string;
  buttonTextEn: string;
  highlight?: boolean;
}

// Product catalog with bilingual support
export const PRODUCTS: ProductInfo[] = [
  {
    id: 'resonance',
    name: '共鳴同步',
    nameEn: 'Resonance Sync',
    subtitle: '手工歌詞製作體驗',
    subtitleEn: 'Handcrafted Lyric Experience',
    price: 320,
    features: [
      '單次創作參與權限',
      '手工互動體驗',
      '數位參與證書',
    ],
    featuresEn: [
      'Single creation access',
      'Interactive experience',
      'Digital certificate',
    ],
    buttonText: '進入',
    buttonTextEn: 'Enter',
  },
  {
    id: 'cinema',
    name: '雲端影院',
    nameEn: 'Cloud Cinema',
    subtitle: '雲端高畫質製作',
    subtitleEn: 'Cloud HD Production',
    price: 2800,
    features: [
      '4K 高畫質重製',
      '無損音質整合',
      '數位親筆簽名',
    ],
    featuresEn: [
      '4K HD remaster',
      'Lossless audio integration',
      'Digital autograph',
    ],
    buttonText: '詳情',
    buttonTextEn: 'Details',
    highlight: true,
  },
  {
    id: 'support',
    name: '音樂食糧',
    nameEn: 'Music Fuel',
    subtitle: '純粹支持',
    subtitleEn: 'Pure Support',
    price: 100,
    features: [
      '贊助一頓飯錢',
      '延續創作能量',
      '直接挹注貢獻',
    ],
    featuresEn: [
      'Sponsor a meal',
      'Sustain creative energy',
      'Direct contribution',
    ],
    buttonText: '支持',
    buttonTextEn: 'Support',
  },
];

/**
 * Create a Stripe Checkout session and redirect to payment page
 */
export async function createCheckoutSession(productId: ProductId): Promise<CheckoutResponse> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      successUrl: `${window.location.origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/#/payment-cancel`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Redirect to Stripe Checkout page
 */
export async function redirectToCheckout(productId: ProductId): Promise<void> {
  try {
    const { url } = await createCheckoutSession(productId);
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
