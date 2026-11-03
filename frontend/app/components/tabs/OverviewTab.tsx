import React from 'react';
import { Flame } from 'lucide-react';
import { TabType } from '../../types';

interface OverviewTabProps {
  btcPriceUSD: number;
  nativeCollateralEth: number;
  tbtcCollateralEth: number;
  debtEth: number;
  ltvStatusColor: string;
  collateralValueUSD: number;
  ltvNumeric: number;
  troveDebtNum: number;
  troveCollNum: number;
  troveIcrNum: number;
  isUserLiquidatable: boolean;
  setActiveTab: (tab: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  btcPriceUSD,
  nativeCollateralEth,
  tbtcCollateralEth,
  debtEth,
  ltvStatusColor,
  collateralValueUSD,
  ltvNumeric,
  troveDebtNum,
  troveCollNum,
  troveIcrNum,
  isUserLiquidatable,
  setActiveTab,
}) => {
  return (
    <div className="space-y-12 animate-fadeIn">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-mono uppercase text-[#E66C35] tracking-widest font-semibold">Protocol Architecture — Wave 2</p>
        <h2 className="text-5xl font-serif-display font-normal tracking-tight leading-none text-[#171715]">
          Composable Bitcoin Credit.
        </h2>
        <p className="text-sm text-[#77756F] leading-relaxed">
          BitStreamfi connects Bitcoin collateral to Mezo's native <strong>BorrowerOperations</strong> and live <strong>PriceFeed</strong> oracle.
          Instead of selling BTC, lock native BTC or tBTC, borrow real testnet MUSD stablecoins at ≤60% LTV, stream salaries second-by-second,
          and amortize debt automatically.
        </p>
      </div>

      {/* MASTER ANATOMY MACHINE */}
      <div className="bg-[#121c2e] border-2 border-[#C59B27]/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a111c] via-[#121c2e] to-[#1a2942] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6 border-b border-slate-700/60 pb-3">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C59B27] animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">FIG. 1 — BitStreamfi & Mezo Native Trove Pipeline</span>
            </div>
            <div className="text-xs font-mono text-[#C59B27] bg-[#C59B27]/10 px-3 py-1 rounded border border-[#C59B27]/30">
              Live Oracle: ${btcPriceUSD.toLocaleString()} USD
            </div>
          </div>

          <div className="w-full h-[390px] flex justify-center items-center overflow-hidden my-2">
            <iframe
              src="/vault-anatomy/embed.html"
              className="w-full h-full border-0 bg-transparent"
              title="BitStreamfi Isometric Collateral Vault Animation"
            />
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-700/60 text-xs font-mono text-slate-300">
            <div>
              <span className="text-[#C59B27]">●</span> Native BTC: <strong className="text-white">{nativeCollateralEth.toFixed(4)} BTC</strong>
            </div>
            <div>
              <span className="text-[#C59B27]">●</span> tBTC Collateral: <strong className="text-white">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
            </div>
            <div>
              <span className="text-[#C59B27]">●</span> Active Debt: <strong className="text-white">{debtEth.toLocaleString()} MUSD</strong>
            </div>
            <div>
              <span className="text-[#C59B27]">●</span> Health / LTV: <strong className={ltvStatusColor}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PROTOCOL METRICS & COMPOSITION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol Trove Integration */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Mezo Trove Protocol</h4>
            <span className="text-[10px] font-mono bg-[#258454]/15 text-[#258454] px-2 py-0.5 rounded font-bold">Composed</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#77756F]">Trove Status:</span>
              <strong className="text-[#258454]">Active (Mezo L2)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Trove Debt:</span>
              <strong className="text-[#171715]">{troveDebtNum.toFixed(1)} MUSD</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Trove Collateral:</span>
              <strong className="text-[#171715]">{troveCollNum.toFixed(4)} BTC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Trove ICR:</span>
              <strong className="text-[#258454]">{troveIcrNum.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Live PriceFeed Oracle */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Live PriceFeed Oracle</h4>
            <span className="text-[10px] font-mono bg-[#258454]/15 text-[#258454] px-2 py-0.5 rounded font-bold">On-Chain</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#77756F]">Oracle Source:</span>
              <strong className="text-[#171715]">Mezo PriceFeed</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">BTC/USD Price:</span>
              <strong className="text-[#258454]">${btcPriceUSD.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Pricing Model:</span>
              <strong className="text-[#171715]">Dynamic (No mock $60k)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Max LTV Allowed:</span>
              <strong className="text-[#171715]">60.00%</strong>
            </div>
          </div>
        </div>

        {/* Safety & Liquidation */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#171715]">Liquidation Engine</h4>
            <span className="text-[10px] font-mono bg-[#B7791F]/15 text-[#B7791F] px-2 py-0.5 rounded font-bold">Keeper Ready</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#77756F]">Liquidation Threshold:</span>
              <strong className="text-[#171715]">75.00% LTV</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Keeper Bonus:</span>
              <strong className="text-[#258454]">5.00% Incentive</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Your Position Status:</span>
              <strong className={isUserLiquidatable ? 'text-[#C7473A]' : 'text-[#258454]'}>
                {isUserLiquidatable ? 'Liquidatable (At Risk)' : 'Healthy & Safe'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77756F]">Accounting:</span>
              <strong className="text-[#171715]">Native / tBTC Separated</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 bg-[#FBFAF7] rounded-2xl border border-[#DEDBD3] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif-display font-bold text-xl text-[#171715]">Ready to stream Bitcoin-backed payroll?</h4>
          <p className="text-xs text-[#77756F] mt-1">Deposit collateral, draw real MUSD, and stream second-by-second to employees or contractors.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className="bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Go to Vault & Borrow →
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className="bg-[#FBFAF7] hover:bg-[#F6F4EF] border border-[#DEDBD3] text-[#171715] text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Create Stream →
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className="bg-[#E66C35]/10 hover:bg-[#E66C35]/20 border border-[#E66C35]/30 text-[#E66C35] text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Risk Simulator & Arena →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
