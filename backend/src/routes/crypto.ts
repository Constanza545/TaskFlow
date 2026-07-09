import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { fetchBitcoinHistory } from '../services/cryptoService';

export const cryptoRouter = Router();
cryptoRouter.use(requireAuth);

// Histórico de precio de Bitcoin (30 días) — fuente: CoinGecko, cacheado en memoria
cryptoRouter.get('/history', async (_req, res) => {
  try {
    res.json(await fetchBitcoinHistory());
  } catch {
    res.status(502).json({ error: 'No se pudo obtener el histórico desde CoinGecko' });
  }
});
