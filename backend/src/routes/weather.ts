import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { fetchWeather } from '../services/weatherService';

export const weatherRouter = Router();
weatherRouter.use(requireAuth);

const querySchema = z.object({
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(80),
});

// Clima actual + pronóstico 7 días — fuente: Open-Meteo, cacheado por ciudad
weatherRouter.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const report = await fetchWeather(parsed.data.city);
    if (!report) {
      res.status(404).json({ error: `No se encontró la ciudad "${parsed.data.city}"` });
      return;
    }
    res.json(report);
  } catch {
    res.status(502).json({ error: 'No se pudo obtener el clima desde Open-Meteo' });
  }
});
