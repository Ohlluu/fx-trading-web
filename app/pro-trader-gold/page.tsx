'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export default function ProTraderGold() {
  const [setupData, setSetupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSetup = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pro-trader-gold/analysis`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSetupData(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const manualScan = async () => {
    setLoading(true);
    await fetchSetup();
    setLoading(false);
  };

  useEffect(() => {
    fetchSetup();
    const interval = setInterval(fetchSetup, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-400 text-5xl mb-4">📊</div>
          <p className="text-gray-400 text-xl">Loading Pro Trader Setup...</p>
        </div>
      </main>
    );
  }

  if (error || !setupData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">Failed to load</p>
          <p className="text-gray-400 mt-2">{error}</p>
          <button onClick={manualScan} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { setup_steps, live_candle, trade_plan, invalidation, why_this_setup, current_price, setup_status, pattern_type } = setupData;

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-6 pb-6 border-b border-gray-700">
        <Link href="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-center mb-3">
          <span className="text-4xl mr-3">📊</span>
          <h1 className="text-4xl font-bold text-purple-400">Pro Trader - Gold Setup Tracker</h1>
        </div>
        <p className="text-gray-400">Real-time educational breakdown • Learn as it trades</p>
        <div className="mt-4">
          <span className="text-2xl text-yellow-400 font-bold">${current_price?.toFixed(2) || 'Loading...'}</span>
          <span className="ml-4 text-purple-400">{setup_status}</span>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button onClick={manualScan} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
          🔄 Force Scan
        </button>
      </div>

      {/* Current Setup Plan */}
      <section className="bg-gray-900 border border-purple-500 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">📋 CURRENT SETUP PLAN</h2>
        <p className="text-lg text-purple-400 mb-6">
          Pattern: {pattern_type?.replace('_', ' ') || 'Scanning'}
        </p>

        {/* Setup Steps */}
        {setup_steps && setup_steps.map((step: any, idx: number) => (
          <div key={idx} className="mb-6 pl-4 border-l-4 border-purple-700">
            {/* Step Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {step.status === 'complete' && '✅'}
                {step.status === 'in_progress' && '⏳'}
                {step.status === 'waiting' && '⏳'}
                {step.status === 'ready' && '🎯'}
              </span>
              <h3 className="text-xl font-bold text-white">Step {step.step}: {step.title}</h3>
            </div>

            {/* Step Details */}
            <p className="text-gray-300 mb-2">{step.details}</p>
            <p className="text-gray-500 text-sm italic mb-3">{step.explanation}</p>

            {/* Watching For Section (for in_progress) */}
            {step.status === 'in_progress' && step.watching_for && (
              <div className="mt-4 bg-gray-800 rounded-lg p-4">
                <h4 className="text-lg font-bold text-yellow-400 mb-3">
                  👁️ What I'm Watching Right Now:
                </h4>
                {Object.entries(step.watching_for).map(([key, req]: [string, any]) => (
                  <div key={key} className="mb-3 pb-3 border-b border-gray-700 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {req.status?.includes('✅') ? '✅' : req.status?.includes('⏳') ? '⏳' : '👀'}
                      </span>
                      <span className="text-white font-semibold">{req.text}</span>
                    </div>
                    <p className="text-gray-400 text-sm ml-7">{req.current}</p>
                    {req.time_left && (
                      <p className="text-yellow-400 text-sm ml-7">⏰ {req.time_left}</p>
                    )}
                    <p className="text-gray-500 text-xs ml-7 italic">{req.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Entry Options (for ready status) */}
            {step.status === 'ready' && step.entry_options && (
              <div className="mt-4 bg-green-900 rounded-lg p-4">
                <h4 className="text-lg font-bold text-green-400 mb-3">🎯 ENTRY OPTIONS:</h4>
                {step.entry_options.map((option: any, i: number) => (
                  <div key={i} className="mb-4 p-3 bg-gray-800 rounded">
                    <h5 className="text-white font-bold mb-2">{option.type}</h5>
                    <p className="text-gray-300 mb-1">Trigger: {option.trigger}</p>
                    {option.current && <p className="text-gray-400 text-sm">{option.current}</p>}
                    {option.current_count && <p className="text-gray-400 text-sm">{option.current_count}</p>}
                    <div className="mt-2 text-sm">
                      <span className="text-green-400">✓ {option.pros}</span>
                      <br />
                      <span className="text-orange-400">⚠ {option.cons}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Live Candle Watch */}
      {live_candle && (
        <section className="bg-gray-900 border border-yellow-500 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 LIVE CANDLE WATCH</h2>
          <p className="text-gray-400 mb-4">
            Current Candle: {live_candle.candle_start} - {live_candle.candle_close_expected}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">High</p>
              <p className="text-white text-xl font-bold">${live_candle.high?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current</p>
              <p className="text-yellow-400 text-xl font-bold">${live_candle.current?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Low</p>
              <p className="text-white text-xl font-bold">${live_candle.low?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Open</p>
              <p className="text-white text-xl font-bold">${live_candle.open?.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-400 mb-2">Candle Progress:</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-yellow-500 h-4 rounded-full transition-all"
                style={{ width: `${((60 - live_candle.time_remaining) / 60) * 100}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-1">{live_candle.time_remaining} minutes remaining</p>
          </div>
        </section>
      )}

      {/* Why This Setup */}
      {why_this_setup && (
        <section className="bg-gray-900 border border-blue-500 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎓 WHY THIS SETUP?</h2>

          {why_this_setup.daily && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Daily Timeframe:</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {why_this_setup.daily.points?.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {why_this_setup.h4 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-blue-400 mb-2">4-Hour Timeframe:</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {why_this_setup.h4.points?.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {why_this_setup.h1 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-blue-400 mb-2">1-Hour Timeframe:</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {why_this_setup.h1.points?.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {why_this_setup.session && (
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">Session Context:</h3>
              <p className="text-gray-300 mb-1">
                {why_this_setup.session.current_session} - {why_this_setup.session.strength}
              </p>
              <p className="text-gray-400 text-sm">{why_this_setup.session.explanation}</p>
            </div>
          )}
        </section>
      )}

      {/* Trade Plan */}
      {trade_plan && trade_plan.status !== 'Not ready yet' && (
        <section className="bg-gray-900 border border-green-500 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 TRADE PLAN</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-green-400">Entry:</h3>
              <p className="text-white text-xl">{trade_plan.entry_price}</p>
              <p className="text-gray-400 text-sm">{trade_plan.entry_method}</p>
            </div>

            {trade_plan.stop_loss && (
              <div>
                <h3 className="text-lg font-bold text-red-400">Stop Loss:</h3>
                <p className="text-white text-xl">{trade_plan.stop_loss.price}</p>
                <p className="text-gray-400 text-sm">{trade_plan.stop_loss.reason}</p>
                <p className="text-gray-500 text-sm italic">{trade_plan.stop_loss.why}</p>
              </div>
            )}

            {trade_plan.take_profit_1 && (
              <div>
                <h3 className="text-lg font-bold text-green-400">Take Profit 1 ({trade_plan.take_profit_1.rr_ratio}):</h3>
                <p className="text-white text-xl">{trade_plan.take_profit_1.price}</p>
                <p className="text-gray-400 text-sm">{trade_plan.take_profit_1.action}</p>
                <p className="text-gray-500 text-sm italic">{trade_plan.take_profit_1.why}</p>
              </div>
            )}

            {trade_plan.take_profit_2 && (
              <div>
                <h3 className="text-lg font-bold text-green-400">Take Profit 2 ({trade_plan.take_profit_2.rr_ratio}):</h3>
                <p className="text-white text-xl">{trade_plan.take_profit_2.price}</p>
                <p className="text-gray-400 text-sm">{trade_plan.take_profit_2.action}</p>
                <p className="text-gray-500 text-sm italic">{trade_plan.take_profit_2.why}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Invalidation Conditions */}
      {invalidation && invalidation.length > 0 && (
        <section className="bg-gray-900 border border-red-500 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">⚠️ INVALIDATION CONDITIONS</h2>
          <p className="text-gray-400 mb-4">Setup is CANCELLED if:</p>

          {invalidation.map((condition: any, i: number) => (
            <div key={i} className="mb-3 p-3 bg-gray-800 rounded">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-xl">❌</span>
                <div>
                  <p className="text-white font-bold">{condition.condition}</p>
                  <p className="text-gray-400 text-sm">Reason: {condition.reason}</p>
                  <p className="text-gray-500 text-sm">Action: {condition.action}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
