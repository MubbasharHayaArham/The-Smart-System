import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://close-snake-57678.upstash.io',
  token: 'AeFOAAIjcDEyOGQ4OTQ4YTM5YmM0YTc4OTMzYTExMTRjZWY0YTYzOXAxMA',
});

export default async function handler(req, res) {
  try {
    const keys = ['QQQ', 'SPY', 'VIX', 'DXY', 'NQ', 'Gold'];
    const results = await Promise.all(keys.map(key => redis.get(key)));
    const livePrices = Object.fromEntries(keys.map((key, i) => [key, results[i]]));
    res.status(200).json({ livePrices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch live prices', details: err.toString() });
  }
}