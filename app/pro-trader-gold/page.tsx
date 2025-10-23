'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export default function ProTraderGold() {
  const [setupData, setSetupData] = useState<any>(null);
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showEnterTradeModal, setShowEnterTradeModal] = useState(false);
  const [entryFormData, setEntryFormData] = useState<any>(null);

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

  const fetchTradeStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pro-trader-gold/trade-status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setTradeStatus(data);
    } catch (err) {
      console.error('Failed to fetch trade status:', err);
    }
  };

  const enterTrade = async (entryData: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pro-trader-gold/enter-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      const result = await response.json();
      if (result.success) {
        setShowEnterTradeModal(false);
        await fetchTradeStatus();
      } else {
        alert('Failed to enter trade: ' + result.error);
      }
    } catch (err) {
      alert('Error entering trade: ' + err);
    }
  };

  const exitTrade = async (exitPrice: number, positionSize: number, reason: string) => {
    if (!confirm(`Exit ${positionSize}% of position at $${exitPrice.toFixed(2)}?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/pro-trader-gold/exit-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_price: exitPrice,
          position_size: positionSize,
          reason: reason
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message + `\nP&L: $${result.pnl} (${result.pnl_pct}%)`);
        await fetchTradeStatus();
        await fetchSetup(); // Refresh setup data
      }
    } catch (err) {
      alert('Error exiting trade: ' + err);
    }
  };

  const openEnterTradeModal = (entryData: any) => {
    setEntryFormData(entryData);
    setShowEnterTradeModal(true);
  };

  useEffect(() => {
    fetchSetup();
    fetchTradeStatus();
    const interval = setInterval(() => {
      fetchSetup();
      fetchTradeStatus();
    }, 60000); // Update every minute
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
          <button onClick={fetchSetup} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { setup_steps, live_candle, trade_plan, invalidation, why_this_setup, current_price, setup_status, pattern_type } = setupData;
  const inTrade = tradeStatus?.in_trade || false;

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
          <span className="ml-4 text-purple-400">{inTrade ? '🔴 IN TRADE' : setup_status}</span>
        </div>
      </header>

      {/* TRADE MONITORING DASHBOARD - Shows when in active trade */}
      {inTrade && tradeStatus && (
        <section className="bg-gradient-to-r from-green-900 to-blue-900 border-2 border-green-500 rounded-xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-white mb-4">📈 ACTIVE TRADE MONITORING</h2>

          {/* P&L Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Entry Price</p>
              <p className="text-white text-2xl font-bold">${tradeStatus.entry_price?.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Current Price</p>
              <p className="text-yellow-400 text-2xl font-bold">${tradeStatus.current_price?.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">P&L</p>
              <p className={`text-2xl font-bold ${tradeStatus.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${tradeStatus.pnl?.toFixed(2)} ({tradeStatus.pnl_pct?.toFixed(2)}%)
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Time in Trade</p>
              <p className="text-blue-400 text-2xl font-bold">{tradeStatus.time_in_trade}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>SL: ${tradeStatus.stop_loss?.toFixed(2)}</span>
              <span>Progress to TP1: {tradeStatus.progress_to_tp1_pct?.toFixed(0)}%</span>
              <span>TP1: ${tradeStatus.take_profit_1?.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all ${tradeStatus.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, tradeStatus.progress_to_tp1_pct))}%` }}
              >
                <span className="flex items-center justify-center h-full text-white text-xs font-bold">
                  {tradeStatus.progress_to_tp1_pct?.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Trade Alerts */}
          {tradeStatus.alerts && tradeStatus.alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-3">⚠️ TRADE MANAGEMENT ALERTS</h3>
              {tradeStatus.alerts.map((alert: any, idx: number) => (
                <div key={idx} className={`mb-3 p-4 rounded-lg border-2 ${
                  alert.priority === 'HIGH' ? 'bg-red-900 border-red-500' :
                  alert.priority === 'MEDIUM' ? 'bg-yellow-900 border-yellow-500' :
                  'bg-blue-900 border-blue-500'
                }`}>
                  <h4 className="text-lg font-bold text-white mb-2">{alert.title}</h4>
                  <p className="text-gray-200 mb-2">{alert.message}</p>
                  {alert.action && (
                    <p className="text-sm text-gray-300 italic">→ {alert.action}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {tradeStatus.position_size === 50 && (
              <button
                onClick={() => openEnterTradeModal({
                  entry_price: current_price,
                  position_size: 50,
                  stop_loss: tradeStatus.stop_loss,
                  take_profit_1: tradeStatus.take_profit_1,
                  take_profit_2: tradeStatus.take_profit_2
                })}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                ➕ ADD 50% MORE (Confirmation Entry)
              </button>
            )}
            {tradeStatus.position_size === 100 && (
              <button
                onClick={() => exitTrade(current_price, 50, "Partial profit taking")}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                🟡 EXIT 50% (Take Partial Profit)
              </button>
            )}
            <button
              onClick={() => exitTrade(current_price, tradeStatus.position_size, "Manual exit")}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
              >
              🔴 EXIT {tradeStatus.position_size === 100 ? 'ALL' : '50%'} (Close Trade)
            </button>
          </div>
        </section>
      )}

      {/* Current Setup Plan - Only show if NOT in trade */}
      {!inTrade && (
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

              {/* Entry Timing Options (50/50 Split Strategy) */}
              {step.status === 'in_progress' && step.entry_timing && (
                <div className="mt-4 bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500 rounded-lg p-5">
                  <h4 className="text-xl font-bold text-white mb-3">
                    ⚡ ENTRY TIMING OPTIONS (50/50 Split Strategy)
                  </h4>
                  <p className="text-blue-200 text-sm mb-4 italic">
                    💡 {step.entry_timing.recommended}
                  </p>

                  {/* Early Entry Option */}
                  <div className={`mb-4 p-4 rounded-lg ${step.entry_timing.early_entry.available ? 'bg-yellow-900 border-2 border-yellow-500' : 'bg-gray-800 border border-gray-600'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-lg font-bold text-white">{step.entry_timing.early_entry.type}</h5>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${step.entry_timing.early_entry.available ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                        {step.entry_timing.early_entry.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300"><strong>Trigger:</strong> {step.entry_timing.early_entry.trigger}</p>
                      <p className="text-green-300"><strong>Entry Price:</strong> {step.entry_timing.early_entry.entry_price}</p>
                      <p className="text-red-300"><strong>Stop Loss:</strong> {step.entry_timing.early_entry.stop_loss}</p>
                      <p className="text-blue-300"><strong>Position Size:</strong> {step.entry_timing.early_entry.position_size}</p>
                      <div className="mt-3 p-3 bg-gray-900 rounded">
                        <p className="text-green-400 whitespace-pre-line mb-2">{step.entry_timing.early_entry.pros}</p>
                        <p className="text-orange-400 whitespace-pre-line">{step.entry_timing.early_entry.cons}</p>
                      </div>
                      {step.entry_timing.early_entry.available && (
                        <button
                          onClick={() => openEnterTradeModal({
                            entry_price: current_price,
                            position_size: 50,
                            stop_loss: parseFloat(step.entry_timing.early_entry.stop_loss.replace('$', '')),
                            take_profit_1: trade_plan?.take_profit_1?.price ? parseFloat(trade_plan.take_profit_1.price.replace('$', '')) : current_price + 10,
                            take_profit_2: trade_plan?.take_profit_2?.price ? parseFloat(trade_plan.take_profit_2.price.replace('$', '')) : current_price + 20
                          })}
                          className="w-full mt-3 p-3 rounded font-bold text-center bg-yellow-600 hover:bg-yellow-700 text-black"
                        >
                          ✅ I TOOK THE TRADE (50% Position)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Entry Option */}
                  <div className="p-4 rounded-lg bg-green-900 border-2 border-green-500">
                    <h5 className="text-lg font-bold text-white mb-2">{step.entry_timing.confirmation_entry.type}</h5>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300"><strong>Trigger:</strong> {step.entry_timing.confirmation_entry.trigger}</p>
                      <p className="text-yellow-300"><strong>Expected Time:</strong> {step.entry_timing.confirmation_entry.expected_time} ({step.entry_timing.confirmation_entry.time_remaining})</p>
                      <p className="text-green-300"><strong>Entry Price:</strong> {step.entry_timing.confirmation_entry.entry_price}</p>
                      <p className="text-blue-300"><strong>Position Size:</strong> {step.entry_timing.confirmation_entry.position_size}</p>
                      <div className="mt-3 p-3 bg-gray-900 rounded">
                        <p className="text-green-400 whitespace-pre-line mb-2">{step.entry_timing.confirmation_entry.pros}</p>
                        <p className="text-orange-400 whitespace-pre-line">{step.entry_timing.confirmation_entry.cons}</p>
                      </div>
                    </div>
                  </div>
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
      )}

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

      {/* Enter Trade Modal */}
      {showEnterTradeModal && entryFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">✅ Confirm Trade Entry</h2>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Entry Price</label>
                <input
                  type="number"
                  value={entryFormData.entry_price}
                  onChange={(e) => setEntryFormData({...entryFormData, entry_price: parseFloat(e.target.value)})}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Position Size</label>
                <select
                  value={entryFormData.position_size}
                  onChange={(e) => setEntryFormData({...entryFormData, position_size: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                >
                  <option value="50">50% (Early Entry)</option>
                  <option value="100">100% (Full Position)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Stop Loss</label>
                <input
                  type="number"
                  value={entryFormData.stop_loss}
                  onChange={(e) => setEntryFormData({...entryFormData, stop_loss: parseFloat(e.target.value)})}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Take Profit 1</label>
                <input
                  type="number"
                  value={entryFormData.take_profit_1}
                  onChange={(e) => setEntryFormData({...entryFormData, take_profit_1: parseFloat(e.target.value)})}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEnterTradeModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => enterTrade({
                  entry_price: entryFormData.entry_price,
                  position_size: entryFormData.position_size,
                  stop_loss: entryFormData.stop_loss,
                  take_profit_1: entryFormData.take_profit_1,
                  take_profit_2: entryFormData.take_profit_2,
                  trade_direction: "LONG"
                })}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
              >
                ✅ Confirm Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
