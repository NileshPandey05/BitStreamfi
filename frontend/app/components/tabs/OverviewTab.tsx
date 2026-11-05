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
    <div className="space-y-10 animate-fadeIn">
      {/* Title & Editorial Lead */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-[#C85A27] tracking-widest font-semibold bg-[#C85A27]/10 px-3 py-1 rounded-full border border-[#C85A27]/20">
          <span>Protocol Architecture · Wave 2</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-serif-display font-bold tracking-tight leading-[1.1] text-[#191816]">
          Composable Bitcoin Credit.
        </h2>
        <p className="text-sm sm:text-base text-[#5C5851] leading-relaxed font-normal">
          BitStreamfi connects Bitcoin collateral to Mezo's native <strong className="text-[#191816] font-semibold">BorrowerOperations</strong> and live <strong className="text-[#191816] font-semibold">PriceFeed</strong> oracle.
          Instead of selling BTC, lock native BTC or tBTC, borrow testnet MUSD stablecoins at ≤60% LTV, stream salaries second-by-second,
          and amortize debt automatically.
        </p>
      </div>

      {/* MASTER ANATOMY MACHINE */}
      <div className="bg-[#0C121D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.18)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#070B12] via-[#0C121D] to-[#141E30] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#E5B338] animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300">FIG. 1 — BitStreamfi & Mezo Native Trove Pipeline</span>
            </div>
            <div className="text-xs font-mono text-[#E5B338] bg-[#E5B338]/10 px-3 py-1 rounded-full border border-[#E5B338]/25 shadow-xs">
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

          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-300">
            <div>
              <span className="text-[#E5B338]">●</span> Native BTC: <strong className="text-white ml-1">{nativeCollateralEth.toFixed(4)} BTC</strong>
            </div>
            <div>
              <span className="text-[#E5B338]">●</span> tBTC Collateral: <strong className="text-white ml-1">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
            </div>
            <div>
              <span className="text-[#E5B338]">●</span> Active Debt: <strong className="text-white ml-1">{debtEth.toLocaleString()} MUSD</strong>
            </div>
            <div>
              <span className="text-[#E5B338]">●</span> Health / LTV: <strong className={`ml-1 ${ltvStatusColor}`}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PROTOCOL METRICS & COMPOSITION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol Trove Integration */}
        <div className="bg-white border border-[#E2DFD7] p-6 rounded-2xl space-y-3.5 shadow-[0_1px_3px_rgba(25,24,22,0.02),0_4px_12px_-4px_rgba(25,24,22,0.04)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#191816]">Mezo Trove Protocol</h4>
            <span className="text-[10px] font-mono bg-[#1F7A4D]/10 text-[#1F7A4D] border border-[#1F7A4D]/20 px-2 py-0.5 rounded-full font-semibold">Composed</span>
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Trove Status:</span>
              <strong className="text-[#1F7A4D]">Active (Mezo L2)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Trove Debt:</span>
              <strong className="text-[#191816]">{troveDebtNum.toFixed(1)} MUSD</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Trove Collateral:</span>
              <strong className="text-[#191816]">{troveCollNum.toFixed(4)} BTC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Trove ICR:</span>
              <strong className="text-[#1F7A4D]">{troveIcrNum.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Live PriceFeed Oracle */}
        <div className="bg-white border border-[#E2DFD7] p-6 rounded-2xl space-y-3.5 shadow-[0_1px_3px_rgba(25,24,22,0.02),0_4px_12px_-4px_rgba(25,24,22,0.04)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#191816]">Live PriceFeed Oracle</h4>
            <span className="text-[10px] font-mono bg-[#1F7A4D]/10 text-[#1F7A4D] border border-[#1F7A4D]/20 px-2 py-0.5 rounded-full font-semibold">On-Chain</span>
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Oracle Source:</span>
              <strong className="text-[#191816]">Mezo PriceFeed</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">BTC/USD Price:</span>
              <strong className="text-[#1F7A4D]">${btcPriceUSD.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Pricing Model:</span>
              <strong className="text-[#191816]">Dynamic (No mock $60k)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Max LTV Allowed:</span>
              <strong className="text-[#191816]">60.00%</strong>
            </div>
          </div>
        </div>

        {/* Safety & Liquidation */}
        <div className="bg-white border border-[#E2DFD7] p-6 rounded-2xl space-y-3.5 shadow-[0_1px_3px_rgba(25,24,22,0.02),0_4px_12px_-4px_rgba(25,24,22,0.04)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#191816]">Liquidation Engine</h4>
            <span className="text-[10px] font-mono bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/20 px-2 py-0.5 rounded-full font-semibold">Keeper Ready</span>
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Liquidation Threshold:</span>
              <strong className="text-[#191816]">75.00% LTV</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Keeper Bonus:</span>
              <strong className="text-[#1F7A4D]">5.00% Incentive</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Position Status:</span>
              <strong className={isUserLiquidatable ? 'text-[#BA3A30]' : 'text-[#1F7A4D]'}>
                {isUserLiquidatable ? 'Liquidatable (At Risk)' : 'Healthy & Safe'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C877D]">Accounting:</span>
              <strong className="text-[#191816]">Native / tBTC Separated</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 sm:p-7 bg-white rounded-2xl border border-[#E2DFD7] flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_1px_3px_rgba(25,24,22,0.02),0_4px_12px_-4px_rgba(25,24,22,0.04)]">
        <div>
          <h4 className="font-serif-display font-bold text-2xl text-[#191816]">Ready to stream Bitcoin-backed payroll?</h4>
          <p className="text-xs text-[#5C5851] mt-1 font-normal">Deposit collateral, draw real MUSD, and stream second-by-second to employees or contractors.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className="bg-[#191816] hover:bg-[#C85A27] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-[0_2px_8px_-2px_rgba(25,24,22,0.25)] cursor-pointer active:scale-95"
          >
            Go to Vault & Borrow →
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className="bg-white hover:bg-[#FAF8F5] border border-[#E2DFD7] hover:border-[#191816]/30 text-[#191816] text-xs font-semibold px-4 py-2.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Create Stream →
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className="bg-[#C85A27]/10 hover:bg-[#C85A27]/18 border border-[#C85A27]/25 text-[#C85A27] text-xs font-semibold px-4 py-2.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Risk Simulator & Arena →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
