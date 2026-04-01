import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Payment intent endpoint (placeholder - requires ZIINA_API_KEY)
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, listingId, buyerId, sellerId } = req.body;
  
  const ZIINA_API_KEY = process.env.ZIINA_API_KEY;
  
  if (!ZIINA_API_KEY) {
    return res.status(500).json({ 
      error: 'Payment service not configured',
      message: 'ZIINA_API_KEY is not set'
    });
  }

  try {
    const response = await fetch('https://api.ziina.com/api/payment_intent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZIINA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency_code: 'AED',
        message: `Payment for listing ${listingId}`,
        metadata: { listingId, buyerId, sellerId },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Payment creation failed');
    }

    res.json(data);
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook endpoint (placeholder)
app.post('/api/webhook/ziina', (req, res) => {
  console.log('Webhook received:', req.body);
  res.json({ received: true });
});

async function startServer() {
  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
