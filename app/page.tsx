'use client';

import Link from 'next/link';

export default function Home() {

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
          XAUUSD Gold • EURUSD • Professional Setups
        </p>
      </header>


      {/* Pro Trader Cards */}
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

        {/* Pro Trader EUR/USD Card - NEW */}
        <Link href="/pro-trader-eurusd">
          <div className="bg-gray-900 border border-cyan-500 rounded-xl p-6 hover:border-cyan-400 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💱</span>
                <h3 className="text-xl font-bold text-cyan-400">Pro Trader</h3>
              </div>
              <span className="bg-cyan-600 px-2 py-1 rounded text-xs text-white">NEW</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">EURUSD • Live Setup</p>
            <p className="text-cyan-400 text-xl font-bold">
              Educational Mode
            </p>
          </div>
        </Link>
      </div>

    </main>
  );
}
