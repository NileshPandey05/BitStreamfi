import React from 'react';
import { Flame, Sliders, RotateCcw, CheckCircle2, Shield, AlertTriangle, Sparkles, Crosshair, Award } from 'lucide-react';
import { ArenaTrove, TabType } from '../../types';

interface SimulatorTabProps {
  baseBtcPrice: number;
  currentTierName: string;
  effectiveKeeperBonusPercent: number;
  keeperEarningsUSD: number;
  simHealToast: string | null;
  setSimHealToast: (msg: string | null) => void;
  handleResetSim: () => void;
  activeSimCollateral: number;
  activeSimDebt: number;
  simTrovePreset: 'borrower1' | 'vaultTrove' | 'wallet' | 'custom';
  applySimPreset: (preset: 'borrower1' | 'vaultTrove' | 'wallet' | 'custom') => void;
  isConnected: boolean;
  collateralEth: number;
  debtEth: number;
  simBtcPrice: number;
  simBtcShockPercent: number;
  setSimBtcShockPercent: (val: number | ((prev: number) => number)) => void;
  simZone: 'safe' | 'warning' | 'liquidatable';
  simIcr: number;
  simLtv: number;
  simCollateralUSD: number;
  actualHealAmount: number;
  activeSimEscrow: number;
  simHealedState: boolean;
  setSimHealedState: (val: boolean) => void;
  handleSimulateAutoHeal: () => void;
  keeperFilter: 'all' | 'liquidatable' | 'safe';
  setKeeperFilter: (filter: 'all' | 'liquidatable' | 'safe') => void;
  arenaTroves: ArenaTrove[];
  keeperLiquidatedIds: string[];
  handleExecuteKeeperLiquidation: (trove: ArenaTrove) => void;
  formatAddress: (addr?: string) => string;
  setActiveTab: (tab: TabType) => void;
  keeperCount: number;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  baseBtcPrice,
  currentTierName,
  effectiveKeeperBonusPercent,
  keeperEarningsUSD,
  simHealToast,
  setSimHealToast,
  handleResetSim,
  activeSimCollateral,
  activeSimDebt,
  simTrovePreset,
  applySimPreset,
  isConnected,
  collateralEth,
  debtEth,
  simBtcPrice,
  simBtcShockPercent,
  setSimBtcShockPercent,
  simZone,
  simIcr,
  simLtv,
  simCollateralUSD,
  actualHealAmount,
  activeSimEscrow,
  simHealedState,
  setSimHealedState,
  handleSimulateAutoHeal,
  keeperFilter,
  setKeeperFilter,
  arenaTroves,
  keeperLiquidatedIds,
  handleExecuteKeeperLiquidation,
  formatAddress,
  setActiveTab,
  keeperCount,
}) => {
  return (
    <div className="space-y-10 animate-fadeIn text-[#F4F3EF]">
      {/* Header */}
      <div className="border-b border-[#26252C] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase text-[#FF7A7A] tracking-widest font-semibold flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-[#D43838]" />
            <span>Wave 2 Protocol Mechanics</span>
          </p>
          <h2 className="text-3xl font-serif-display font-bold text-[#F4F3EF] mt-1 flex items-center space-x-2">
            <span>Market Shock Simulator & Public Keeper Arena</span>
            <span className="text-xs font-serif text-[#C5A059] italic font-normal tracking-normal">試練闘技場</span>
          </h2>
          <p className="text-xs text-[#9A978F] mt-1 font-mono">
            Stress-test troves against volatile Bitcoin price swings, observe autonomous Self-Healing buffer intervention, and claim keeper bounties with tier-boosted liquidation payouts.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="bg-[#121216] border border-[#26252C] px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="text-[#9A978F]">Oracle BTC:</span>
            <strong className="text-[#F4F3EF]">${baseBtcPrice.toLocaleString()}</strong>
          </div>
          <div className="bg-[#121216] border border-[#26252C] px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="text-[#9A978F]">Keeper Tier:</span>
            <span className="text-[#FF7A7A] font-bold">{currentTierName} ({effectiveKeeperBonusPercent.toFixed(1)}% Bounty)</span>
          </div>
          <div className="bg-[#121216] border border-[#34D399]/30 px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-[#34D399]">
            <Award className="w-3.5 h-3.5" />
            <span>Keeper Profit: <strong>${keeperEarningsUSD.toFixed(0)} MUSD</strong></span>
          </div>
        </div>
      </div>

      {/* Notification Toast if Auto-Heal was triggered in simulation */}
      {simHealToast && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/40 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3 text-xs font-mono text-[#34D399]">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{simHealToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSimHealToast(null)}
            className="text-[#34D399] hover:text-[#F4F3EF] text-xs font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* PART 1: INTERACTIVE MARKET SHOCK & TROVE RISK SIMULATOR */}
      <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl shadow-sm space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#26252C] pb-4 gap-3">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-[#D43838]" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF]">
                1. Interactive Market Shock & Trove Stress-Test Engine
              </h3>
              <p className="text-xs text-[#9A978F]">
                Simulate BTC price shocks (-50% to +50%) to observe live Trove ICR recalculations and autonomous Self-Healing thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetSim}
              className="px-3.5 py-1.5 bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF] text-xs font-mono rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#9A978F]" />
              <span>Reset (0%)</span>
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#9A978F]">
            <span>Select Trove Scenario to Stress-Test:</span>
            <span>Currently Simulating: <strong className="text-[#F4F3EF]">{activeSimCollateral.toFixed(2)} BTC</strong> collateral / <strong className="text-[#34D399]">${activeSimDebt.toLocaleString()} MUSD</strong> debt</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'borrower1', label: 'Mezo Testnet Borrower #1', col: '0.05 tBTC', debt: '$1,790' },
              { id: 'vaultTrove', label: 'MezoFlow Composed Trove', col: '0.05 BTC', debt: '$1,800' },
              { id: 'wallet', label: isConnected && collateralEth > 0 ? 'My Connected Trove' : 'Connected Wallet', col: isConnected && collateralEth > 0 ? `${collateralEth.toFixed(2)} BTC` : 'Live', debt: isConnected && debtEth > 0 ? `$${debtEth.toLocaleString()}` : 'Live' },
              { id: 'custom', label: 'Stress-Test Simulation', col: '0.10 BTC', debt: '$3,500' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applySimPreset(p.id as any)}
                className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  simTrovePreset === p.id
                    ? 'bg-[#D43838] text-white border-[#D43838] shadow-[0_0_15px_rgba(212,56,56,0.3)]'
                    : 'bg-[#0A0A0C] hover:bg-[#18181E] text-[#F4F3EF] border-[#26252C]'
                }`}
              >
                <div className="font-bold truncate">{p.label}</div>
                <div className={`text-[11px] font-mono mt-0.5 ${simTrovePreset === p.id ? 'text-[#FFEAEA]' : 'text-[#9A978F]'}`}>
                  {p.col} · {p.debt}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Shock Slider Controls */}
        <div className="bg-[#0A0A0C] p-6 rounded-2xl border border-[#26252C] space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#9A978F] font-bold">
                Bitcoin Market Price Shock
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-serif-display font-bold text-[#F4F3EF]">
                  ${simBtcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    simBtcShockPercent > 0
                      ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30'
                      : simBtcShockPercent < 0
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                      : 'bg-[#9A978F]/15 text-[#9A978F] border-[#26252C]'
                  }`}
                >
                  {simBtcShockPercent > 0 ? `+${simBtcShockPercent}%` : `${simBtcShockPercent}%`}
                </span>
                <span className="text-xs font-mono text-[#9A978F]">
                  (Baseline: ${baseBtcPrice.toLocaleString()})
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '⚡ Flash Crash (-35%)', val: -35 },
                { label: '⚠️ Stress (-20%)', val: -20 },
                { label: '● Baseline (0%)', val: 0 },
                { label: '🚀 Rally (+25%)', val: 25 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    setSimBtcShockPercent(btn.val);
                    setSimHealedState(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    simBtcShockPercent === btn.val
                      ? 'bg-[#D43838] text-white font-bold shadow-xs'
                      : 'bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Range Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={simBtcShockPercent}
              onChange={(e) => {
                setSimBtcShockPercent(Number(e.target.value));
                setSimHealedState(false);
              }}
              className="w-full h-2.5 bg-[#18181E] rounded-lg appearance-none cursor-pointer accent-[#D43838] border border-[#26252C]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#9A978F]">
              <span className="text-[#EF4444]">-50% ($38k Crash)</span>
              <span className="text-[#EF4444]">-35% Danger</span>
              <span className="text-[#FF7A7A]">-15% Auto-Heal Trigger</span>
              <span className="text-[#F4F3EF] font-bold">0% Real Price</span>
              <span className="text-[#34D399]">+25% Bull</span>
              <span className="text-[#34D399]">+50% ATH</span>
            </div>
          </div>
        </div>

        {/* Dynamic Health Meters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Collateral Valuation */}
          <div className="bg-[#0A0A0C] p-5 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Simulated Collateral Value</span>
            <div className="text-2xl font-serif-display font-bold text-[#F4F3EF]">
              ${simCollateralUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">
              Backed by {activeSimCollateral.toFixed(4)} BTC
            </span>
          </div>

          {/* Metric 2: Trove Debt */}
          <div className="bg-[#0A0A0C] p-5 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Active MUSD Loan Principal</span>
            <div className={`text-2xl font-serif-display font-bold ${simHealedState ? 'text-[#34D399]' : 'text-[#F4F3EF]'}`}>
              ${activeSimDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">
              {simHealedState ? '✓ Auto-heal debt reduced' : 'Mezo Trove borrowed debt'}
            </span>
          </div>

          {/* Metric 3: LTV Gauge */}
          <div className="bg-[#0A0A0C] p-5 rounded-xl border border-[#26252C] space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#9A978F]">Simulated LTV</span>
              <strong className={simLtv > 75 ? 'text-[#EF4444]' : simLtv > 60 ? 'text-[#FF7A7A]' : 'text-[#34D399]'}>
                {simLtv.toFixed(1)}%
              </strong>
            </div>
            <div className="w-full bg-[#18181E] h-2 rounded-full overflow-hidden border border-[#26252C]">
              <div
                className={`h-full transition-all duration-300 ${
                  simLtv > 75 ? 'bg-[#EF4444]' : simLtv > 60 ? 'bg-[#D43838]' : 'bg-[#34D399]'
                }`}
                style={{ width: `${Math.min(100, simLtv)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">
              Max LTV: 60% · Liquidation: 75%
            </span>
          </div>

          {/* Metric 4: Trove ICR Gauge */}
          <div className="bg-[#0A0A0C] p-5 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Individual ICR Health</span>
            <div
              className={`text-2xl font-serif-display font-bold ${
                simZone === 'safe'
                  ? 'text-[#34D399]'
                  : simZone === 'warning'
                  ? 'text-[#FF7A7A]'
                  : 'text-[#EF4444]'
              }`}
            >
              {simIcr > 900 ? '>900%' : `${simIcr.toFixed(1)}%`}
            </div>
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  simZone === 'safe'
                    ? 'bg-[#34D399]'
                    : simZone === 'warning'
                    ? 'bg-[#D43838] animate-pulse'
                    : 'bg-[#EF4444] animate-ping'
                }`}
              />
              <span className="text-[11px] font-mono font-bold capitalize text-[#F4F3EF]">
                {simZone === 'safe' ? 'Safe Zone (>150%)' : simZone === 'warning' ? 'Auto-Heal Armed (135-150%)' : 'Liquidatable Danger (<133%)'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Banner & Auto-Heal Action Console */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            simZone === 'safe'
              ? 'bg-[#34D399]/5 border-[#34D399]/30'
              : simZone === 'warning'
              ? 'bg-[#D43838]/10 border-[#D43838]/40'
              : 'bg-[#EF4444]/15 border-[#EF4444]/40'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center space-x-2">
                {simZone === 'safe' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                ) : simZone === 'warning' ? (
                  <Shield className="w-5 h-5 text-[#FF7A7A] animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] animate-bounce" />
                )}
                <h4 className="font-bold text-sm text-[#F4F3EF]">
                  {simZone === 'safe'
                    ? 'Trove Health Factor Optimal — No Intervention Required'
                    : simZone === 'warning'
                    ? `Self-Healing Trove Armed: Deficit of $${actualHealAmount.toFixed(0)} MUSD Detected`
                    : `CRITICAL ALERT: Trove ICR Dropped to ${simIcr.toFixed(1)}% — Vulnerable to Keeper Liquidation!`}
                </h4>
              </div>

              <p className="text-xs text-[#9A978F] leading-relaxed">
                {simZone === 'safe'
                  ? `The collateralization ratio is comfortably above the 150% threshold. The linked unvested escrow buffer of $${activeSimEscrow.toLocaleString()} MUSD remains untouched in payroll.`
                  : simZone === 'warning'
                  ? `Under this market drop, ICR is below 150%. The autonomous autoHealTrove contract hook will draw $${actualHealAmount.toFixed(0)} MUSD from unvested escrow to pay down debt, bringing ICR back to 160% without touching employee vested pay.`
                  : `The position has exceeded the 75% LTV limit (ICR < 133%). Public keepers can now liquidate this trove and claim a ${effectiveKeeperBonusPercent.toFixed(1)}% collateral bonus unless auto-heal immediately reclaims debt.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {simZone !== 'safe' && !simHealedState && (
                <button
                  type="button"
                  onClick={handleSimulateAutoHeal}
                  className="px-5 py-2.5 bg-[#34D399] hover:bg-[#2BB882] text-[#0A0A0C] text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all flex items-center justify-center space-x-2 cursor-pointer animate-pulse"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulate Auto-Heal Recovery</span>
                </button>
              )}
              {simHealedState && (
                <div className="px-4 py-2 bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs font-mono font-bold rounded-xl flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Healed: Target 160% ICR Restored</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PART 2: PUBLIC KEEPER LIQUIDATION ARENA */}
      <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#26252C] pb-4 gap-3">
          <div className="flex items-center space-x-2.5">
            <Crosshair className="w-5 h-5 text-[#EF4444]" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF]">
                2. Public Keeper Liquidation Arena & Bounty Rankings
              </h3>
              <p className="text-xs text-[#9A978F]">
                Open Trove positions on Mezo. Keepers repay debt on positions exceeding 75% LTV and seize Bitcoin collateral at an instant discount.
              </p>
            </div>
          </div>

          {/* Staker Tier Keeper Advantage Callout */}
          <div className="bg-[#D43838]/15 border border-[#D43838]/30 px-3.5 py-2 rounded-xl text-xs font-mono">
            <span className="text-[#9A978F]">Your Active Keeper Bonus: </span>
            <strong className="text-[#FF7A7A]">+{effectiveKeeperBonusPercent.toFixed(1)}% Payout</strong>
            {currentTierName !== 'Gold' && (
              <button
                type="button"
                onClick={() => setActiveTab('staking')}
                className="ml-2 underline text-[#F4F3EF] hover:text-[#FF7A7A] cursor-pointer"
              >
                (Stake MEZO for +7.5% →)
              </button>
            )}
          </div>
        </div>

        {/* Keeper Controls & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-[#9A978F]">Filter Positions:</span>
            {(['all', 'liquidatable', 'safe'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setKeeperFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  keeperFilter === f
                    ? 'bg-[#D43838] text-white font-bold shadow-xs'
                    : 'bg-[#0A0A0C] hover:bg-[#18181E] border border-[#26252C] text-[#9A978F]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="text-[#9A978F]">
            Shock Slider Applied: <strong className="text-[#F4F3EF]">{simBtcShockPercent > 0 ? `+${simBtcShockPercent}%` : `${simBtcShockPercent}%`}</strong> (${simBtcPrice.toLocaleString()} BTC)
          </div>
        </div>

        {/* Positions Table */}
        <div className="overflow-x-auto border border-[#26252C] rounded-xl bg-[#0A0A0C]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#121216] border-b border-[#26252C] text-[#9A978F]">
              <tr>
                <th className="py-3 px-4">Trove Identity</th>
                <th className="py-3 px-4">Collateral</th>
                <th className="py-3 px-4">Debt (MUSD)</th>
                <th className="py-3 px-4">Simulated USD</th>
                <th className="py-3 px-4">Live ICR</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Keeper Bounty ({effectiveKeeperBonusPercent.toFixed(1)}%)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26252C]">
              {arenaTroves
                .map((trove) => {
                  const colUsd = trove.collateralBtc * simBtcPrice;
                  const icr = trove.debtMusd > 0 ? (colUsd / trove.debtMusd) * 100 : 999;
                  const isLiquidatable = icr < 133.33 || (trove.debtMusd / colUsd) > 0.75;
                  const isWarning = !isLiquidatable && icr < 150;
                  const isLiquidated = keeperLiquidatedIds.includes(trove.id);
                  const bountyUSD = trove.debtMusd * (effectiveKeeperBonusPercent / 100);

                  return {
                    ...trove,
                    colUsd,
                    icr,
                    isLiquidatable,
                    isWarning,
                    isLiquidated,
                    bountyUSD,
                  };
                })
                .filter((t) => {
                  if (keeperFilter === 'liquidatable') return t.isLiquidatable;
                  if (keeperFilter === 'safe') return !t.isLiquidatable;
                  return true;
                })
                .map((t) => (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      t.isLiquidatable
                        ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 font-medium'
                        : t.isWarning
                        ? 'bg-[#D43838]/10 hover:bg-[#D43838]/15'
                        : 'hover:bg-[#121216]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#F4F3EF]">{t.name}</div>
                      <div className="text-[11px] text-[#9A978F]">{formatAddress(t.borrower)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#F4F3EF]">
                      {t.collateralBtc.toFixed(2)} {t.isNative ? 'BTC' : 'tBTC'}
                    </td>
                    <td className="py-3.5 px-4 text-[#F4F3EF]">
                      ${t.debtMusd.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[#9A978F]">
                      ${t.colUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          t.icr < 133.33
                            ? 'text-[#EF4444]'
                            : t.icr < 150
                            ? 'text-[#FF7A7A]'
                            : 'text-[#34D399]'
                        }`}
                      >
                        {t.icr > 900 ? '>900%' : `${t.icr.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.isLiquidated ? (
                        <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-bold text-[10px]">
                          ✓ Liquidated
                        </span>
                      ) : t.isLiquidatable ? (
                        <span className="px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] font-bold text-[10px] animate-pulse">
                          ● Liquidatable
                        </span>
                      ) : t.isWarning ? (
                        <span className="px-2 py-0.5 rounded bg-[#D43838]/15 border border-[#D43838]/30 text-[#FF7A7A] font-bold text-[10px]">
                          ● Auto-Heal Armed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] font-bold text-[10px]">
                          ● Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[#34D399] font-bold">
                        +${t.bountyUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })} MUSD
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.isLiquidated ? (
                        <span className="text-xs text-[#34D399] font-bold">Claimed</span>
                      ) : t.isLiquidatable ? (
                        <button
                          type="button"
                          onClick={() => handleExecuteKeeperLiquidation(t)}
                          className="px-3.5 py-1.5 bg-[#EF4444] hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all cursor-pointer animate-pulse"
                        >
                          Liquidate & Claim Bounty
                        </button>
                      ) : (
                        <span className="text-xs text-[#9A978F]">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Keeper Performance & Architecture Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Keepers Executed</span>
            <div className="text-xl font-serif-display font-bold text-[#F4F3EF]">
              {keeperCount} Positions
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">In this browser session</span>
          </div>

          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Total Keeper Bounties Seized</span>
            <div className="text-xl font-serif-display font-bold text-[#34D399]">
              ${keeperEarningsUSD.toFixed(2)} MUSD
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">Instant collateral arbitrage profit</span>
          </div>

          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1">
            <span className="text-xs font-mono text-[#9A978F]">Mezo Contract Integration</span>
            <div className="text-xl font-serif-display font-bold text-[#C5A059]">
              Liquidation Engine
            </div>
            <span className="text-[11px] font-mono text-[#9A978F] block">MezoFlowVault.sol · Line 220</span>
          </div>
        </div>
      </div>
    </div>
  );
};
