'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MultiPairData {
  timestamp: string;
  pairs: {
    XAUUSD: any;
    GBPUSD: any;
  };
  summary: {
    total_signals: number;
    active_pairs: string[];
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export default function Home() {
  const [data, setData] = useState<MultiPairData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchMultiPairData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/multi-pair/analysis`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultiPairData();
    const interval = setInterval(fetchMultiPairData, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signal': return 'bg-green-500';
      case 'no_signal': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signal': return 'SIGNAL';
      case 'no_signal': return 'WAITING';
      case 'error': return 'ERROR';
      default: return 'LOADING';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">📊</div>
          <p className="text-gray-400 text-xl">Loading Multi-Pair System...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">Failed to load data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  const xauusdStatus = data.pairs.XAUUSD?.status;
  const gbpusdStatus = data.pairs.GBPUSD?.status;

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8 pb-6 border-b border-gray-700">
        <div className="flex items-center justify-center mb-3">
          <span className="text-4xl mr-3">📊</span>
          <h1 className="text-4xl font-bold text-green-500">Multi-Pair Trading</h1>
        </div>
        <p className="text-gray-400">XAUUSD + GBPUSD Smart Confluence</p>
        <p className="text-gray-500 text-sm mt-2">
          Active Signals: {data.summary.total_signals} | Pairs: {data.summary.active_pairs.join(', ') || 'None'}
        </p>
      </header>

      {/* System Status */}
      <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-white font-semibold mb-2">XAU/USD</p>
            <span className={`inline-block px-6 py-2 rounded-full text-white font-semibold ${getStatusColor(xauusdStatus)}`}>
              {getStatusLabel(xauusdStatus)}
            </span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-2">GBP/USD</p>
            <span className={`inline-block px-6 py-2 rounded-full text-white font-semibold ${getStatusColor(gbpusdStatus)}`}>
              {getStatusLabel(gbpusdStatus)}
            </span>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* XAUUSD Card */}
        <Link href="/gold">
          <div className={`bg-gray-900 border ${xauusdStatus === 'signal' ? 'border-green-500 bg-green-950' : 'border-gray-700'} rounded-xl p-6 hover:border-yellow-500 transition-colors cursor-pointer`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💎</span>
                <h3 className="text-2xl font-bold text-yellow-400">XAU/USD Gold</h3>
              </div>
              {xauusdStatus === 'signal' && (
                <span className="bg-green-500 p-2 rounded-full">⚡</span>
              )}
            </div>
            <p className="text-gray-400 mb-2">2:1 R:R • 98% S/R System</p>
            <p className="text-yellow-400 text-2xl font-bold">
              ${data.pairs.XAUUSD?.data?.market_data?.current_price?.toFixed(2) || 'Loading...'}
            </p>
          </div>
        </Link>

        {/* GBPUSD Card */}
        <Link href="/gbp">
          <div className={`bg-gray-900 border ${gbpusdStatus === 'signal' ? 'border-green-500 bg-green-950' : 'border-gray-700'} rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📈</span>
                <h3 className="text-2xl font-bold text-blue-400">GBP/USD</h3>
              </div>
              {gbpusdStatus === 'signal' && (
                <span className="bg-green-500 p-2 rounded-full">⚡</span>
              )}
            </div>
            <p className="text-gray-400 mb-2">4:1 R:R • Research-Based</p>
            <p className="text-blue-400 text-2xl font-bold">
              ${data.pairs.GBPUSD?.data?.market_data?.current_price?.toFixed(5) || 'Loading...'}
            </p>
          </div>
        </Link>
      </div>

      {/* Active Signals Preview */}
      {data.summary.total_signals > 0 && (
        <section className="bg-gray-900 border border-green-500 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">🔥 Active Signals</h2>
          {data.summary.active_pairs.map((pair) => (
            <div key={pair} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
              <span className="text-white font-semibold">{pair}</span>
              <span className="text-green-500 font-bold">
                {pair === 'XAUUSD' ?
                  data.pairs.XAUUSD?.data?.signal?.signal :
                  data.pairs.GBPUSD?.data?.signal?.signal
                }
              </span>
              <Link href={pair === 'XAUUSD' ? '/gold' : '/gbp'}>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                  View
                </button>
              </Link>
            </div>
          ))}
        </section>
      )}

      {error && (
        <div className="bg-red-900 border border-red-500 rounded-xl p-6 mt-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={fetchMultiPairData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </main>
  );
}
