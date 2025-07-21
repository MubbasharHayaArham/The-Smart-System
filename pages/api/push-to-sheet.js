
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://devoted-gibbon-21581.upstash.io',
  token: 'AVRNAAIjcDEwY2Q3MzI2MDA5NTA0YzQwYmRmNTkxMDBjMWNkMTZjMXAxMA',
});



const GOOGLE_SHEET_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzKyhYK53HXw3U9REGLtlLs12Jkhid63TZi6s8OZpr0khg5v2_FuYHiRIYoVU2XuIs1/exec';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const price = await redis.get('qqq_price');
      if (!price) return res.status(404).json({ error: 'Price not found' });

      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qqqPrice: price }),
      });

      return res.status(200).json({ message: 'Price pushed to sheet', price });
    } catch (err) {
      console.error('Push error:', err);
      return res.status(500).json({ error: 'Push failed' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}