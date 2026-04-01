import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Payment intent endpoint (works when ZIINA_API_KEY is set)
app.post('/api/create-payment-intent', async (req, res) => {
  const ZIINA_API_KEY = process.env.ZIINA_API_KEY;
  
  if (!ZIINA_API_KEY) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  try {
    const { amount, currency, orderId, customerEmail } = req.body;

    const response = await fetch('https://api.ziina.com/api/payment_intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZIINA_API_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency_code: currency || 'AED',
        message: `Order ${orderId}`,
        success_url: `${req.headers.origin}/payment-success?order=${orderId}`,
        cancel_url: `${req.headers.origin}/payment-cancelled?order=${orderId}`,
        customer_email: customerEmail,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Payment creation failed');
    }

    res.json(data);
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Webhook endpoint
app.post('/api/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.json({ received: true });
});

async function startServer() {
  try {
    const vite = await createViteServer({
      root: __dirname,
      server: { 
        middlewareMode: true,
        hmr: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
