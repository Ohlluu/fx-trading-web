'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PairScore {
  pair: string;
  buyScore: number;
  sellScore: number;
  price: number;
  buyStatus: string;
  sellStatus: string;
  loading: boolean;
  error?: string;
}

export default function Home() {
  const [scores, setScores] = useState<PairScore[]>([
    { pair: 'XAU/USD', buyScore: 0, sellScore: 0, price: 0, buyStatus: '', sellStatus: '', loading: true },
    { pair: 'EUR/USD', buyScore: 0, sellScore: 0, price: 0, buyStatus: '', sellStatus: '', loading: true },
    { pair: 'GBP/USD', buyScore: 0, sellScore: 0, price: 0, buyStatus: '', sellStatus: '', loading: true }
  ]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fx-trading-backend-production.up.railway.app';

  const fetchPairData = async (pair: string, endpoint: string) => {
    try {
      const [bullishRes, bearishRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/${endpoint}/bullish`),
        fetch(`${BACKEND_URL}/api/${endpoint}/bearish`)
      ]);

      const bullish = await bullishRes.json();
      const bearish = await bearishRes.json();

      const buyScore = bullish?.total_score || 0;
      const sellScore = bearish?.total_score || 0;
      const price = bullish?.current_price || bearish?.current_price || 0;

      const getStatus = (score: number, tradable: boolean) => {
        if (score >= 5 && tradable) return 'READY';
        if (score >= 5) return 'SETUP';
        return 'NO SIGNAL';
      };

      return {
        pair,
        buyScore,
        sellScore,
        price,
        buyStatus: getStatus(buyScore, bullish?.tradable),
        sellStatus: getStatus(sellScore, bearish?.tradable),
        loading: false
      };
    } catch (error) {
      return {
        pair,
        buyScore: 0,
        sellScore: 0,
        price: 0,
        buyStatus: 'ERROR',
        sellStatus: 'ERROR',
        loading: false,
        error: 'Failed to load'
      };
    }
  };

  useEffect(() => {
    const loadScores = async () => {
      const pairs = [
        { pair: 'XAU/USD', endpoint: 'pro-trader-gold' },
        { pair: 'EUR/USD', endpoint: 'pro-trader-eurusd' },
        { pair: 'GBP/USD', endpoint: 'pro-trader-gbpusd' }
      ];

      const results = await Promise.all(
        pairs.map(p => fetchPairData(p.pair, p.endpoint))
      );

      setScores(results);
    };

    loadScores();
    const interval = setInterval(loadScores, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatPrice = (price: number, pair: string) => {
    if (pair === 'XAU/USD') return `$${price.toFixed(2)}`;
    return price.toFixed(5);
  };

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8 pb-6 border-b border-gray-700">
        <div className="flex items-center justify-center mb-3">
          <span className="text-4xl mr-3">📊</span>
          <h1 className="text-4xl font-bold text-green-500">Pro Trader Dashboard</h1>
        </div>
        <p className="text-gray-400">ICT/Smart Money Confluence System</p>
        <p className="text-gray-500 text-sm mt-2">
          XAUUSD Gold • EURUSD • GBPUSD • Professional Setups
        </p>
      </header>

      {/* Live Scores Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          Live Trading Scores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scores.map((score) => (
            <div key={score.pair} className="bg-gray-900 border border-gray-700 rounded-lg p-5">
              {/* Pair Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">{score.pair}</h3>
                <span className="text-sm text-gray-400">
                  {score.loading ? '...' : formatPrice(score.price, score.pair)}
                </span>
              </div>

              {/* BUY/SELL Scores */}
              <div className="grid grid-cols-2 gap-3">
                {/* BUY Score */}
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-300 uppercase mb-1">Buy</div>
                  <div className={`text-3xl font-bold ${getScoreColor(score.buyScore)}`}>
                    {score.loading ? '...' : score.buyScore}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {score.loading ? '...' : score.buyStatus}
                  </div>
                </div>

                {/* SELL Score */}
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-300 uppercase mb-1">Sell</div>
                  <div className={`text-3xl font-bold ${getScoreColor(score.sellScore)}`}>
                    {score.loading ? '...' : score.sellScore}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {score.loading ? '...' : score.sellStatus}
                  </div>
                </div>
              </div>

              {/* Error State */}
              {score.error && (
                <div className="mt-2 text-xs text-red-400">{score.error}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Score Legend */}
      <div className="mb-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
            <span className="text-gray-300">≥7 Strong</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
            <span className="text-gray-300">≥5 Good</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>
            <span className="text-gray-300">&lt;5 Weak</span>
          </div>
        </div>
      </div>

      {/* Pro Trader Cards - ORIGINAL BUTTONS */}
      <h2 className="text-2xl font-bold text-white mb-4">Detailed Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pro Trader Gold Card */}
        <Link href="/pro-trader-gold">
          <div className="bg-gray-900 border border-purple-500 rounded-xl p-6 hover:border-purple-400 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-xl font-bold text-purple-400">Pro Trader</h3>
              </div>
              <span className="bg-purple-600 px-2 py-1 rounded text-xs text-white">GOLD</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">XAUUSD • Live Setup</p>
            <p className="text-purple-400 text-xl font-bold">
              Educational Mode
            </p>
          </div>
        </Link>

        {/* Pro Trader EUR/USD Card */}
        <Link href="/pro-trader-eurusd">
          <div className="bg-gray-900 border border-cyan-500 rounded-xl p-6 hover:border-cyan-400 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💱</span>
                <h3 className="text-xl font-bold text-cyan-400">Pro Trader</h3>
              </div>
              <span className="bg-cyan-600 px-2 py-1 rounded text-xs text-white">EUR/USD</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">EURUSD • Live Setup</p>
            <p className="text-cyan-400 text-xl font-bold">
              Educational Mode
            </p>
          </div>
        </Link>

        {/* Pro Trader GBP/USD Card - NEW */}
        <Link href="/pro-trader-gbpusd">
          <div className="bg-gray-900 border border-green-500 rounded-xl p-6 hover:border-green-400 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💷</span>
                <h3 className="text-xl font-bold text-green-400">Pro Trader</h3>
              </div>
              <span className="bg-green-600 px-2 py-1 rounded text-xs text-white">NEW</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">GBPUSD • Live Setup</p>
            <p className="text-green-400 text-xl font-bold">
              Educational Mode
            </p>
          </div>
        </Link>
      </div>

    </main>
  );
}
