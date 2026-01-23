import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with secret key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Product configurations - prices in TWD (smallest unit = 1 TWD)
const PRODUCTS = {
  resonance: {
    name: '共鳴同步 - 手工歌詞製作體驗',
    description: '單次創作參與權限 + 手工互動體驗 + 數位參與證書',
    price: 32000, // NT$ 320 in cents
    currency: 'twd',
  },
  cinema: {
    name: '典藏 - 雲端影院高畫質製作',
    description: '4K 高畫質重製 + 無損音質整合 + 數位親筆簽名',
    price: 280000, // NT$ 2,800 in cents
    currency: 'twd',
  },
  support: {
    name: '音樂食糧 - 純粹支持',
    description: '贊助一頓飯錢 + 延續創作能量 + 直接挹注貢獻',
    price: 10000, // NT$ 100 in cents
    currency: 'twd',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, successUrl, cancelUrl } = req.body;

    // Validate product ID
    if (!productId || !PRODUCTS[productId as keyof typeof PRODUCTS]) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = PRODUCTS[productId as keyof typeof PRODUCTS];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/#/payment-cancel`,
      metadata: {
        productId,
      },
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}
