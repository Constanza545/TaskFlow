import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { setIo } from './io';
import { fetchCryptoPrices } from '../services/cryptoService';
import { authService } from '../services/authService';

/**
 * Inicializa Socket.io sobre el servidor HTTP existente.
 * - Autentica la conexión con el mismo JWT que usa la API REST.
 * - Difunde "activity:new" cuando alguien crea/edita/elimina tareas (lo emiten
 *   las rutas de tareas); el tablero lo usa para recargarse en tiempo real.
 * - Sondea CoinGecko cada CRYPTO_POLL_INTERVAL_MS y difunde los precios ("crypto:update"),
 *   simulando un feed en tiempo real sobre una API externa que no ofrece push nativo.
 */
export function initSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: { origin: env.corsOrigin },
  });
  setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('No autenticado'));
    try {
      socket.data.user = authService.verifyToken(token);
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  let lastPrices: unknown = null;
  const pollCrypto = async () => {
    try {
      const prices = await fetchCryptoPrices();
      lastPrices = prices;
      io.emit('crypto:update', prices);
    } catch (err) {
      io.emit('crypto:error', { message: (err as Error).message });
    }
  };

  pollCrypto();
  setInterval(pollCrypto, env.cryptoPollIntervalMs);

  io.on('connection', (socket) => {
    if (lastPrices) socket.emit('crypto:update', lastPrices);
  });

  return io;
}
