import { Card } from './ui';
import { CryptoPrice } from '../types';

const LABELS: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  solana: 'Solana (SOL)',
};

export function CryptoWidget({ prices, connected }: { prices: CryptoPrice[]; connected: boolean }) {
  return (
    <Card
      title="Mercado cripto (CoinGecko, en vivo)"
      headerRight={
        <span
          className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
          title={connected ? 'Conectado' : 'Desconectado'}
        />
      }
    >
      {prices.length === 0 ? (
        <p className="text-sm text-gray-400">Esperando datos...</p>
      ) : (
        <ul className="space-y-2">
          {prices.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{LABELS[p.id] ?? p.id}</span>
              <span className="flex items-center gap-2">
                <span className="font-medium">${p.usd.toLocaleString('en-US')}</span>
                <span className={p.usd_24h_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {p.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(p.usd_24h_change).toFixed(2)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Datos públicos vía api.coingecko.com — refrescados automáticamente por el backend.
      </p>
    </Card>
  );
}
