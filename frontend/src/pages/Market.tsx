import { useRealtime } from '../hooks/useRealtime';
import { MarketChart } from '../components/MarketChart';
import { CryptoWidget } from '../components/CryptoWidget';

export function Market() {
  const { prices, connected } = useRealtime();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mercado</h2>
        <p className="text-sm text-gray-500">
          Precios en vivo por WebSocket e histórico diario, ambos desde la API pública de
          CoinGecko.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <MarketChart />
        <CryptoWidget prices={prices} connected={connected} />
      </div>
    </>
  );
}
