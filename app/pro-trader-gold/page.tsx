/*
 * PRO TRADER GOLD - XAUUSD Trading Dashboard
 * ============================================
 *
 * DEPLOYMENT INFO:
 * - Production Site: https://fx-trading-web-zcca.vercel.app/pro-trader-gold
 * - Local Dev: http://localhost:3000/pro-trader-gold
 * - Backend (Railway): https://web-production-8c5ca.up.railway.app
 * - Backend Repo: https://github.com/Ohlluu/fx-trading-backend
 *
 * BACKEND API ENDPOINTS:
 * - GET /api/pro-trader-gold/analysis - Returns bullish & bearish trader setups
 * - GET /api/pro-trader-gold/trade-status - Returns current trade status
 * - POST /api/pro-trader-gold/enter-trade - Enter a new trade position
 * - POST /api/pro-trader-gold/exit-trade - Exit current trade position
 *
 * ENVIRONMENT VARIABLES:
 * - NEXT_PUBLIC_BACKEND_URL - Set in Vercel to Railway URL for production
 * - Local: Uses localhost:8002 from .env.local
 *
 * DATA STRUCTURE FROM API:
 * {
 *   bullish: {
 *     setup_status: "RETEST_WAITING" | "SCANNING" | "READY",
 *     pattern_type: "BREAKOUT_RETEST" | "LIQUIDITY_GRAB" | etc,
 *     total_score: number (confluence points, need 5+ to enter),
 *     confidence: string,
 *     confluences: [{ type, score, description }],
 *     setup_steps: [{ step, title, status, details, watching_for, entry_timing }],
 *     trade_plan: { entry_price, stop_loss, take_profit_1, take_profit_2 },
 *     current_price: number,
 *     live_candle: { high, low, open, current, time_remaining },
 *     why_this_setup: { daily, h4, h1, session },
 *     invalidation: [{ condition, reason, action }]
 *   },
 *   bearish: { ... same structure ... }
 * }
 *
 * FEATURES:
 * - Dual trader system (bullish + bearish scanning simultaneously)
 * - Confluence-based pattern detection (liquidity grabs, FVGs, order blocks, etc)
 * - 50/50 split entry strategy (early entry + confirmation entry)
 * - Real-time trade monitoring with P&L tracking
 * - Step-by-step setup progression with "watching for" indicators
 * - Multi-timeframe analysis (Daily, H4, H1)
 * - Trade management alerts and position scaling
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export default function ProTraderGold() {
  const [setupData, setSetupData] = useState<any>(null);
  const [bullishData, setBullishData] = useState<any>(null);
  const [bearishData, setBearishData] = useState<any>(null);
  const [selectedTrader, setSelectedTrader] = useState<'bullish' | 'bearish'>('bullish'); // Track which trader is selected
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
      // New API returns bullish and bearish
      setBullishData(data.bullish);
      setBearishData(data.bearish);
      // Don't set setupData here - let the click handlers and useEffect handle it
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
  }, []); // Only run on mount

  // Update setupData when selectedTrader or data changes
  useEffect(() => {
    if (bullishData && bearishData) {
      setSetupData(selectedTrader === 'bullish' ? bullishData : bearishData);
    }
  }, [selectedTrader, bullishData, bearishData]);

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

  const { setup_steps, live_candle, trade_plan, invalidation, why_this_setup, current_price, setup_status, pattern_type, confluences } = setupData;
  const inTrade = tradeStatus?.in_trade || false;

  // Extract liquidity grab level from confluences
  const getLiquidityGrabLevel = (): number | null => {
    if (!confluences || !Array.isArray(confluences)) return null;

    const liquidityGrab = confluences.find((c: any) => c.type === 'LIQUIDITY_GRAB');
    if (!liquidityGrab) return null;

    // Extract price from description like "Liquidity Grab at H4 support $4000.00!"
    const match = liquidityGrab.description.match(/\$(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Helper function to convert pip offset to actual price
  const convertPipToPrice = (pipString: string): string => {
    if (!pipString) return pipString;

    // Extract number from string like "$2.00" or "$-5.00"
    const pipValue = parseFloat(pipString.replace('$', ''));
    if (isNaN(pipValue)) return pipString;

    // Get the base price (liquidity grab level)
    const basePrice = getLiquidityGrabLevel();
    if (!basePrice) return pipString;

    // For gold (XAU/USD), 1 pip = $0.10
    const actualPrice = basePrice + (pipValue / 10);

    return `$${actualPrice.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-6 pb-6 border-b border-gray-700">
        <Link href="/" className="text-purple-400 hover:text-purple-300 inline-block mb-4">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-center mb-3">
          <span className="text-4xl mr-3">📊</span>
          <h1 className="text-4xl font-bold text-purple-400">Pro Traders - Gold Setups</h1>
        </div>
        <p className="text-gray-400">📈 Bullish (BUY) • 📉 Bearish (SELL) • Dual Scanning</p>
        <div className="mt-4">
          <span className="text-2xl text-yellow-400 font-bold">${current_price?.toFixed(2) || 'Loading...'}</span>
          <span className="ml-4 text-purple-400">{inTrade ? '🔴 IN TRADE' : 'SCANNING'}</span>
        </div>
      </header>

      {/* DUAL TRADER STATUS - CLICKABLE CARDS */}
      {!inTrade && bullishData && bearishData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Bullish Trader Card - Clickable */}
          <button
            onClick={() => {
              setSelectedTrader('bullish');
              setSetupData(bullishData);
            }}
            className={`text-left bg-gradient-to-br from-green-900 to-gray-900 border-2 rounded-xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedTrader === 'bullish' ? 'border-green-400 shadow-green-500/50 shadow-xl' : 'border-green-600'
            }`}
          >
            <h3 className="text-2xl font-bold text-green-400 mb-2">📈 BULLISH TRADER (BUY)</h3>
            <p className="text-green-300 text-lg">Status: {bullishData.setup_status}</p>
            <p className="text-gray-400 text-sm">Pattern: {bullishData.h1_setup?.pattern_type?.replace('_', ' ') || 'Scanning'}</p>
            {bullishData.h1_setup?.direction && (
              <p className="text-green-200 text-sm mt-2">Direction: {bullishData.h1_setup.direction}</p>
            )}
            {selectedTrader === 'bullish' && (
              <p className="text-green-300 text-sm mt-2 font-semibold">✓ Selected - Viewing details below</p>
            )}
          </button>

          {/* Bearish Trader Card - Clickable */}
          <button
            onClick={() => {
              setSelectedTrader('bearish');
              setSetupData(bearishData);
            }}
            className={`text-left bg-gradient-to-br from-red-900 to-gray-900 border-2 rounded-xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedTrader === 'bearish' ? 'border-red-400 shadow-red-500/50 shadow-xl' : 'border-red-600'
            }`}
          >
            <h3 className="text-2xl font-bold text-red-400 mb-2">📉 BEARISH TRADER (SELL)</h3>
            <p className="text-red-300 text-lg">Status: {bearishData.setup_status}</p>
            <p className="text-gray-400 text-sm">Pattern: {bearishData.h1_setup?.pattern_type?.replace('_', ' ') || 'Scanning'}</p>
            {bearishData.h1_setup?.direction && (
              <p className="text-red-200 text-sm mt-2">Direction: {bearishData.h1_setup.direction}</p>
            )}
            {selectedTrader === 'bearish' && (
              <p className="text-red-300 text-sm mt-2 font-semibold">✓ Selected - Viewing details below</p>
            )}
          </button>
        </div>
      )}

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
          <p className="text-lg text-purple-400 mb-2">
            Pattern: {pattern_type?.replace('_', ' ') || 'Scanning'}
          </p>

          {/* Confluence Score Display */}
          {setupData.total_score !== undefined && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-2 rounded-xl">
              {/* Score Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">🎯 Confluence Analysis</h3>
                  <p className="text-gray-400 text-sm">
                    Professional multi-pattern detection system
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {setupData.total_score >= 10 && <span className="text-yellow-400">⭐⭐⭐</span>}
                    {setupData.total_score >= 7 && setupData.total_score < 10 && <span className="text-blue-400">⭐⭐</span>}
                    {setupData.total_score >= 5 && setupData.total_score < 7 && <span className="text-green-400">⭐</span>}
                    {setupData.total_score < 5 && <span className="text-gray-500">⚠️</span>}
                  </div>
                  <div className={`text-2xl font-bold ${
                    setupData.total_score >= 10 ? 'text-yellow-400' :
                    setupData.total_score >= 7 ? 'text-blue-400' :
                    setupData.total_score >= 5 ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {setupData.total_score} points
                  </div>
                </div>
              </div>

              {/* Confidence Badge */}
              {setupData.confidence && (
                <div className="mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    setupData.confidence.includes('EXTREME') ? 'bg-yellow-500 text-black' :
                    setupData.confidence.includes('HIGH') ? 'bg-blue-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {setupData.confidence}
                  </span>
                </div>
              )}

              {/* Entry Threshold Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Entry Threshold</span>
                  <span>5 points minimum</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      setupData.total_score >= 10 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                      setupData.total_score >= 7 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                      setupData.total_score >= 5 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                      'bg-gray-600'
                    }`}
                    style={{ width: `${Math.min((setupData.total_score / 12) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Confluences List */}
              {setupData.confluences && setupData.confluences.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">
                    Patterns Detected:
                  </h4>
                  <div className="space-y-2">
                    {setupData.confluences.map((confluence: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        {/* Icon based on pattern type */}
                        <span className="text-2xl flex-shrink-0">
                          {confluence.type === 'LIQUIDITY_GRAB' && '🔥'}
                          {confluence.type === 'FVG' && '📊'}
                          {confluence.type === 'ORDER_BLOCK' && '📦'}
                          {confluence.type === 'BREAKOUT_RETEST' && '🔄'}
                          {confluence.type === 'BREAKDOWN_RETEST' && '🔽'}
                          {confluence.type === 'DEMAND_ZONE' && '💚'}
                          {confluence.type === 'SUPPLY_ZONE' && '🔴'}
                          {confluence.type === 'BULLISH_BOS' && '📈'}
                          {confluence.type === 'BEARISH_BOS' && '📉'}
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">
                              {confluence.type.replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              confluence.score === 4 ? 'bg-red-500 text-white' :
                              confluence.score === 3 ? 'bg-orange-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              +{confluence.score}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            {confluence.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Confluence Warning */}
              {setupData.confluences && setupData.confluences.length === 0 && setupData.total_score < 5 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ <strong>Low Confluence</strong> - Need minimum 5 points to enter. Keep scanning...
                  </p>
                </div>
              )}

              {/* Structure Info */}
              {setupData.structure && setupData.structure.structure_type !== 'NEUTRAL' && (
                <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {setupData.structure.structure_type.includes('BOS') && '✅'}
                      {setupData.structure.structure_type.includes('CHOCH') && '⚠️'}
                    </span>
                    <span className="text-gray-300 text-sm">
                      <strong>Market Structure:</strong> {setupData.structure.description || setupData.structure.structure_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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

                      {/* Entry Details */}
                      <div className="mb-3 space-y-1">
                        <p className="text-gray-300">📍 <strong>Entry:</strong> {option.entry}</p>
                        {option.stop_loss && (
                          <p className="text-red-400">🛑 <strong>Stop Loss:</strong> {option.stop_loss}</p>
                        )}
                        {option.take_profit && (
                          <p className="text-green-400">🎯 <strong>Take Profit:</strong> {option.take_profit}</p>
                        )}
                      </div>

                      {/* Risk/Reward Metrics */}
                      {option.risk_pips && (
                        <div className="mb-3 p-2 bg-gray-900 rounded">
                          <p className="text-sm text-gray-300">
                            Risk: <span className="text-red-300">{option.risk_pips}</span> |
                            Reward: <span className="text-green-300"> {option.reward_pips}</span>
                          </p>
                          <p className="text-sm text-blue-300">R:R = {option.risk_reward}</p>
                        </div>
                      )}

                      {/* SL/TP Explanations */}
                      {option.why_sl && (
                        <div className="mb-2 p-2 bg-red-900 bg-opacity-20 rounded border border-red-800">
                          <p className="text-xs text-red-300">{option.why_sl}</p>
                        </div>
                      )}
                      {option.why_tp && (
                        <div className="mb-3 p-2 bg-green-900 bg-opacity-20 rounded border border-green-800">
                          <p className="text-xs text-green-300">{option.why_tp}</p>
                        </div>
                      )}

                      {/* Trigger */}
                      <p className="text-gray-300 mb-1 text-sm">⚡ <strong>Trigger:</strong> {option.trigger}</p>
                      {option.current && <p className="text-gray-400 text-sm">{option.current}</p>}
                      {option.current_count && <p className="text-gray-400 text-sm">{option.current_count}</p>}

                      {/* Pros/Cons */}
                      <div className="mt-2 text-sm">
                        <span className="text-green-400">✓ {option.pros}</span>
                        <br />
                        <span className="text-orange-400">⚠ {option.cons}</span>
                      </div>
                    </div>
                  ))}

                  {/* Recommendation */}
                  {step.recommendation && (
                    <div className="mt-3 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
                      <p className="text-sm text-blue-300">💡 <strong>Recommendation:</strong> {step.recommendation}</p>
                    </div>
                  )}
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
            <div className="mb-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-blue-400">Daily Timeframe (D1)</h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last updated: {why_this_setup.daily.last_updated}</p>
                  <p className="text-xs text-gray-400">{why_this_setup.daily.next_update}</p>
                </div>
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {why_this_setup.daily.points?.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {why_this_setup.h4 && (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-blue-400">4-Hour Timeframe (H4)</h3>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last updated: {why_this_setup.h4.last_updated}</p>
                  <p className="text-xs text-gray-400">{why_this_setup.h4.next_update}</p>
                </div>
              </div>
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
              <p className="text-white text-xl">
                {convertPipToPrice(trade_plan.entry_price)}
              </p>
              <p className="text-gray-400 text-sm">{trade_plan.entry_method}</p>
            </div>

            {trade_plan.stop_loss && (
              <div>
                <h3 className="text-lg font-bold text-red-400">Stop Loss:</h3>
                <p className="text-white text-xl">
                  {convertPipToPrice(trade_plan.stop_loss.price)}
                </p>
                <p className="text-gray-400 text-sm">{trade_plan.stop_loss.reason}</p>
                <p className="text-gray-500 text-sm italic">{trade_plan.stop_loss.why}</p>
              </div>
            )}

            {trade_plan.take_profit_1 && (
              <div>
                <h3 className="text-lg font-bold text-green-400">Take Profit 1 ({trade_plan.take_profit_1.rr_ratio}):</h3>
                <p className="text-white text-xl">
                  {convertPipToPrice(trade_plan.take_profit_1.price)}
                </p>
                <p className="text-gray-400 text-sm">{trade_plan.take_profit_1.action}</p>
                <p className="text-gray-500 text-sm italic">{trade_plan.take_profit_1.why}</p>
              </div>
            )}

            {trade_plan.take_profit_2 && (
              <div>
                <h3 className="text-lg font-bold text-green-400">Take Profit 2 ({trade_plan.take_profit_2.rr_ratio}):</h3>
                <p className="text-white text-xl">
                  {convertPipToPrice(trade_plan.take_profit_2.price)}
                </p>
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
