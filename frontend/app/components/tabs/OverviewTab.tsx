import React from 'react';
import Image from 'next/image';
import { Flame, ArrowRight, ShieldCheck, Zap, Droplets } from 'lucide-react';
import { TabType } from '../../types';
import { HankoStamp } from '../ui/HankoStamp';

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
    <div className="space-y-12 animate-fadeIn text-[#F4F3EF]">
      {/* HERO SECTION: SUMI-E TEMPLE LANDSCAPE & EDO FINANCIAL HERITAGE */}
      <div className="relative rounded-3xl overflow-hidden border border-[#26252C] bg-[#0E0E12] shadow-2xl">
        {/* Top Hero Container with Background Artwork */}
        <div className="relative min-h-[440px] sm:min-h-[480px] p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
          {/* Background Artwork Banner */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="/images/edo_temple_stream_hero.jpg"
              alt="Edo Japanese Temple Landscape & Flowing River"
              fill
              priority
              className="object-cover object-center opacity-35 scale-105 filter contrast-125"
            />
            {/* Multi-layered dark sumi ink gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E12] via-[#0E0E12]/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D43838]/15 via-transparent to-transparent" />
          </div>

          {/* Top Badge & Hanko Seal */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HankoStamp size="sm" primaryKanji="水流" subKanji="自律" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A7A] bg-[#D43838]/15 border border-[#D43838]/30 px-3 py-1 rounded-full font-bold">
                Wave 2 Protocol-Aware Integration
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-[#C5A059] bg-[#121216]/80 px-3 py-1 rounded-xl border border-[#26252C]">
              <span>大阪堂島 1730</span>
              <span className="text-[#9A978F]">•</span>
              <span>Where Futures & Streams Began</span>
            </div>
          </div>

          {/* Main Headline & Description */}
          <div className="relative z-10 max-w-3xl space-y-4 pt-6">
            <h2 className="text-4xl sm:text-6xl font-serif-display font-normal tracking-tight text-[#F4F3EF] leading-tight">
              Keep your Bitcoin locked. <br />
              <span className="italic text-[#FF7A7A]">Stream liquidity anyway.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#BDB9AF] leading-relaxed max-w-2xl font-sans">
              BitStreamfi connects Bitcoin collateral to Mezo's native <strong>BorrowerOperations</strong> and real-time <strong>PriceFeed</strong> oracle.
              Lock native BTC or tBTC, borrow real testnet MUSD stablecoins at ≤60% LTV, stream payroll second-by-second,
              and amortize debt automatically through stream-split amortization.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className="bg-[#D43838] hover:bg-[#E24A4A] text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(212,56,56,0.35)] flex items-center space-x-2 cursor-pointer border border-[#FF6B6B]/30"
              >
                <span>Deposit Collateral & Borrow MUSD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className="bg-[#121216]/90 hover:bg-[#18181E] text-[#F4F3EF] hover:border-[#D43838]/40 border border-[#26252C] text-xs font-mono px-5 py-3 rounded-xl transition-all cursor-pointer"
              >
                Launch MUSD Payroll Stream
              </button>
            </div>
          </div>
        </div>

        {/* STATS TICKER BAR (Inspired by Doji Edo Terminal) */}
        <div className="border-t border-[#26252C] bg-[#121216]/95 backdrop-blur-md px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="border-r border-[#26252C]/60 pr-4">
            <span className="text-[#9A978F] block text-[11px]">Bitcoin Oracle Price</span>
            <div className="text-lg font-bold text-[#F4F3EF] mt-0.5">${btcPriceUSD.toLocaleString()}</div>
            <span className="text-[10px] text-[#34D399]">Mezo PriceFeed Live</span>
          </div>

          <div className="border-r border-[#26252C]/60 pr-4">
            <span className="text-[#9A978F] block text-[11px]">Protocol Trove ICR</span>
            <div className="text-lg font-bold text-[#34D399] mt-0.5">{troveIcrNum.toFixed(1)}%</div>
            <span className="text-[10px] text-[#9A978F]">Min 110% Liquidation Ratio</span>
          </div>

          <div className="border-r border-[#26252C]/60 pr-4">
            <span className="text-[#9A978F] block text-[11px]">Max Borrowing LTV</span>
            <div className="text-lg font-bold text-[#F4F3EF] mt-0.5">60.00%</div>
            <span className="text-[10px] text-[#9A978F]">BorrowerOperations Safe Cap</span>
          </div>

          <div>
            <span className="text-[#9A978F] block text-[11px]">Network & Settlement</span>
            <div className="text-lg font-bold text-[#FF7A7A] mt-0.5">Mezo Testnet</div>
            <span className="text-[10px] text-[#9A978F]">Chain ID 31611 • Real MUSD</span>
          </div>
        </div>
      </div>

      {/* MASTER ANATOMY MACHINE (Dark Obsidian Frame) */}
      <div className="bg-[#121216] border border-[#26252C] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0A0C] via-[#121216] to-[#18181E] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6 border-b border-[#26252C] pb-3">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D43838] animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-[#BDB9AF]">
                FIG. 1 — BitStreamfi & Mezo Native Trove Pipeline
              </span>
            </div>
            <div className="text-xs font-mono text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-xl border border-[#C5A059]/30">
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

          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#26252C] text-xs font-mono text-[#BDB9AF]">
            <div>
              <span className="text-[#D43838]">●</span> Native BTC: <strong className="text-[#F4F3EF]">{nativeCollateralEth.toFixed(4)} BTC</strong>
            </div>
            <div>
              <span className="text-[#D43838]">●</span> tBTC Collateral: <strong className="text-[#F4F3EF]">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
            </div>
            <div>
              <span className="text-[#D43838]">●</span> Active Debt: <strong className="text-[#F4F3EF]">{debtEth.toLocaleString()} MUSD</strong>
            </div>
            <div>
              <span className="text-[#D43838]">●</span> Health / LTV: <strong className={ltvStatusColor}>{collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PROTOCOL METRICS & COMPOSITION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol Trove Integration */}
        <div className="bg-[#121216] border border-[#26252C] p-6 rounded-2xl space-y-3 shadow-sm hover:border-[#D43838]/40 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F3EF] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              <span>Mezo Trove Protocol</span>
            </h4>
            <span className="text-[10px] font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 px-2 py-0.5 rounded font-bold">
              Composed
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Trove Status:</span>
              <strong className="text-[#34D399]">Active (Mezo L2)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Trove Debt:</span>
              <strong className="text-[#F4F3EF]">{troveDebtNum.toFixed(1)} MUSD</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Trove Collateral:</span>
              <strong className="text-[#F4F3EF]">{troveCollNum.toFixed(4)} BTC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Trove ICR:</span>
              <strong className="text-[#34D399]">{troveIcrNum.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Live PriceFeed Oracle */}
        <div className="bg-[#121216] border border-[#26252C] p-6 rounded-2xl space-y-3 shadow-sm hover:border-[#D43838]/40 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F3EF] flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#C5A059]" />
              <span>Live PriceFeed Oracle</span>
            </h4>
            <span className="text-[10px] font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 px-2 py-0.5 rounded font-bold">
              On-Chain
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Oracle Source:</span>
              <strong className="text-[#F4F3EF]">Mezo PriceFeed</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">BTC/USD Price:</span>
              <strong className="text-[#34D399]">${btcPriceUSD.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Pricing Model:</span>
              <strong className="text-[#F4F3EF]">Dynamic (Zero mock $60k)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Max LTV Allowed:</span>
              <strong className="text-[#F4F3EF]">60.00%</strong>
            </div>
          </div>
        </div>

        {/* Autonomous Settlement */}
        <div className="bg-[#121216] border border-[#26252C] p-6 rounded-2xl space-y-3 shadow-sm hover:border-[#D43838]/40 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F3EF] flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-[#FF7A7A]" />
              <span>Self-Healing Settlement</span>
            </h4>
            <span className="text-[10px] font-mono bg-[#D43838]/15 text-[#FF7A7A] border border-[#D43838]/30 px-2 py-0.5 rounded font-bold">
              Autonomous
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Amortization Engine:</span>
              <strong className="text-[#F4F3EF]">Continuous Stream Split</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Default Split Ratio:</span>
              <strong className="text-[#FF7A7A]">15% to Debt Repay</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Liquidation Shield:</span>
              <strong className="text-[#34D399]">Active Escrow Pull</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9A978F]">Keeper Liquidation:</span>
              <strong className="text-[#F4F3EF]">Permissionless 5% Bounty</strong>
            </div>
          </div>
        </div>
      </div>

      {/* LIQUIDATION WARNING / HEALTH BANNER */}
      {isUserLiquidatable && (
        <div className="bg-[#EF4444]/15 border-2 border-[#EF4444] p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Flame className="w-8 h-8 text-[#EF4444] animate-bounce shrink-0" />
            <div>
              <h3 className="font-bold text-[#F4F3EF] text-sm">TROVE LIQUIDATION WARNING</h3>
              <p className="text-xs text-[#BDB9AF] font-mono mt-0.5">
                Your position has dropped below 110% ICR and can be liquidated by any keeper in the Arena.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-colors shrink-0 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            Emergency Repay / Add Collateral →
          </button>
        </div>
      )}
    </div>
  );
};
