'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GBPUSDSignal {
  signal: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confluence_score: number;
  risk_reward_ratio: number;
  trade_reasons?: string[];
  timestamp: string;
}

interface AnalysisData {
  status: 'signal' | 'no_signal' | 'error';
  pair: string;
  data: {
    signal?: GBPUSDSignal;
    skip_info?: {
      skip_reason: string;
      context: string;
    };
    market_data: {
      current_price: number;
      session: {
        current_session: string;
        session_strength: string;
      };
      timestamp: string;
    };
    last_update?: string;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export default function GBPPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchAnalysis = async (force_refresh: boolean = false) => {
    try {
      const endpoint = force_refresh ? '/api/gbpusd/scan' : '/api/gbpusd/analysis';
      const method = force_refresh ? 'POST' : 'GET';
      const url = `${BACKEND_URL}${endpoint}`;

      const response = await fetch(url, {
        method: method,
        headers: force_refresh ? { 'Content-Type': 'application/json' } : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisData(data);
      setError('');

      if (data.data?.last_update) {
        setLastUpdate(new Date(data.data.last_update).toLocaleString());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Network Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const manualScan = async () => {
    setLoading(true);
    await fetchAnalysis(true);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalysis(false);
    const interval = setInterval(() => fetchAnalysis(false), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-orange-500';
    }
  };

  const getSignalTextColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      default: return 'text-orange-500';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-400 text-5xl mb-4">📈</div>
          <p className="text-gray-400 text-xl">Loading GBPUSD Analysis...</p>
        </div>
      </main>
    );
  }

  if (!analysisData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">Failed to load data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  const { status, data } = analysisData;
  const signal = data.signal;
  const marketData = data.market_data;
  const skipInfo = data.skip_info;

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-6 pb-6 border-b border-gray-700">
        <Link href="/" className="text-blue-400 hover:text-blue-300 inline-block mb-4">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-center mb-3">
          <span className="text-4xl mr-3">📈</span>
          <h1 className="text-4xl font-bold text-blue-400">GBP/USD</h1>
        </div>
        <p className="text-gray-400">4:1 R:R Research-Based System</p>
        {lastUpdate && <p className="text-gray-500 text-sm mt-2">Updated: {lastUpdate}</p>}
      </header>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={manualScan}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <span>🔄</span> Force Scan
        </button>
        <button
          onClick={() => fetchAnalysis(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Market Overview */}
      <section className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Market Overview</h2>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Current Price:</span>
          <span className="text-3xl text-blue-400 font-bold">
            ${marketData?.current_price?.toFixed(5) || 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Session:</span>
          <span className="bg-blue-600 px-4 py-2 rounded-full text-white font-semibold">
            {marketData?.session?.current_session?.replace('_', ' ').toUpperCase() || 'Loading...'}
          </span>
        </div>
        <div className="bg-black rounded-lg p-4">
          <p className="text-blue-400 text-sm mb-1">System: 50.6% Win Rate • 4:1 Risk/Reward</p>
          <p className="text-blue-400 text-sm">Average TP Time: 69 hours</p>
        </div>
      </section>

      {/* Signal or Skip */}
      {status === 'signal' && signal ? (
        <section className={`bg-gray-900 border-2 ${getSignalTextColor(signal.signal)} rounded-xl p-6 mb-6`}>
          <div className="flex justify-between items-center mb-6">
            <div className={`${getSignalColor(signal.signal)} px-6 py-3 rounded-full flex items-center gap-2`}>
              <span className="text-2xl">📈</span>
              <span className="text-white font-bold text-xl">{signal.signal}</span>
            </div>
            <div className="bg-blue-700 px-4 py-2 rounded-lg">
              <span className="text-white font-semibold">4:1 R:R</span>
            </div>
          </div>

          {/* Trade Details */}
          <div className="grid grid-cols-3 gap-4 bg-black rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Entry</p>
              <p className="text-white font-bold text-lg">${signal.entry_price.toFixed(5)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Stop Loss</p>
              <p className="text-red-500 font-bold text-lg">${signal.stop_loss.toFixed(5)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Take Profit</p>
              <p className="text-green-500 font-bold text-lg">${signal.take_profit.toFixed(5)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl text-blue-400 font-bold">{signal.confluence_score}/25</p>
              <p className="text-gray-400 text-sm">Confluence</p>
            </div>
            <div>
              <p className="text-2xl text-blue-400 font-bold">4:1</p>
              <p className="text-gray-400 text-sm">Risk:Reward</p>
            </div>
            <div>
              <p className="text-2xl text-blue-400 font-bold">69h</p>
              <p className="text-gray-400 text-sm">Avg TP Time</p>
            </div>
          </div>

          {/* Trade Reasons */}
          {signal.trade_reasons && (
            <div>
              <h3 className="text-lg text-blue-400 font-bold mb-3">Analysis Summary</h3>
              {signal.trade_reasons.slice(0, 3).map((reason, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <p className="text-gray-300">{reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gray-900 border border-orange-500 rounded-xl p-6 mb-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">⏸️</span>
            <h2 className="text-2xl text-orange-500 font-bold">No Signal</h2>
          </div>
          <p className="text-gray-300 text-lg mb-2">
            {skipInfo?.skip_reason || 'Waiting for optimal GBPUSD setup...'}
          </p>
          {skipInfo?.context && (
            <p className="text-gray-400 italic">{skipInfo.context}</p>
          )}
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
    </main>
  );
}
