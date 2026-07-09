import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { CryptoPrice } from '../types';

/**
 * Suscribe a los eventos de Socket.io emitidos por el backend:
 * - crypto:update -> precios de criptomonedas refrescados desde CoinGecko
 * (El tablero se suscribe a "activity:new" por su cuenta en TaskBoard.)
 */
export function useRealtime() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onPrices = (data: CryptoPrice[]) => setPrices(data);

    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('crypto:update', onPrices);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('crypto:update', onPrices);
    };
  }, []);

  return { prices, connected };
}
