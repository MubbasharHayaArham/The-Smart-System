
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://devoted-gibbon-21581.upstash.io',
  token: 'AVRNAAIjcDEwY2Q3MzI2MDA5NTA0YzQwYmRmNTkxMDBjMWNkMTZjMXAxMA',
});


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const prices = data?.livePrices;

      if (!prices || typeof prices !== 'object') {
        return res.status(400).json({ error: 'Missing livePrices payload' });
      }

      // Write each symbol to Redis
      const entries = Object.entries(prices);
      await Promise.all(entries.map(([symbol, value]) => redis.set(symbol, value)));

      return res.status(200).json({ message: 'Prices updated', prices });
    } catch (error) {
      console.error("Error saving to Redis:", error);
      return res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const keys = ['QQQ', 'VIX', 'DXY', 'SPY', 'NQ'];
      const results = await Promise.all(keys.map(key => redis.get(key)));
      const prices = Object.fromEntries(keys.map((key, idx) => [key, results[idx]]));
      return res.status(200).json(prices);
    } catch {
      return res.status(500).json({ error: 'Error retrieving prices' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
