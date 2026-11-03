import React from 'react';
import { Shield, DollarSign, Activity, Zap, AlertTriangle, ChevronRight, Sliders } from 'lucide-react';
import { ConnectPrompt } from '../ui/ConnectPrompt';
import { ActiveAction, TxStatus, TabType } from '../../types';

interface VaultTabProps {
  mounted: boolean;
  isConnected: boolean;
  handleOpenConnectWallet: () => void;
  nativeBalance: any;
  tbtcBalance: any;
  musdBalance: any;
  btcPriceUSD: number;
  nativeCollateralEth: number;
  tbtcCollateralEth: number;
  collateralMode: 'native' | 'tbtc';
  setCollateralMode: (mode: 'native' | 'tbtc') => void;
  collateralAmount: string;
  setCollateralAmount: (val: string) => void;
  handleApprove: (token: 'musd' | 'tbtc' | 'mezo', spenderName: 'streamer' | 'vault' | 'creditEngine' | 'stakingBoost', amount: string) => void;
  isTbtcApproved: boolean;
  genericPending: boolean;
  activeAction: ActiveAction;
  isReady: boolean;
  vaultPending: boolean;
  txStatus: TxStatus;
  handleDepositCollateral: (e: React.FormEvent) => void;
  withdrawMode: 'native' | 'tbtc';
  setWithdrawMode: (mode: 'native' | 'tbtc') => void;
  withdrawAmount: string;
  setWithdrawAmount: (val: string) => void;
  maxWithdrawableEth: number;
  collateralEth: number;
  handleWithdrawCollateral: (e: React.FormEvent) => void;
  ltvStatusColor: string;
  collateralValueUSD: number;
  ltvNumeric: number;
  debtEth: number;
  availableBorrowUSD: number;
  borrowAmount: string;
  setBorrowAmount: (val: string) => void;
  handleBorrowMUSD: (e: React.FormEvent) => void;
  repayAmount: string;
  setRepayAmount: (val: string) => void;
  isVaultApproved: boolean;
  handleRepayMUSD: (e: React.FormEvent) => void;
  streamIdForAutoHeal: string;
  setStreamIdForAutoHeal: (id: string) => void;
  isAutoHealEligible: boolean;
  autoHealCurrentICR: number;
  debtToRestoreEth: number;
  unvestedBufferEth: number;
  handleAutoHealTrove: (e: React.FormEvent) => void;
  yieldBalance: any;
  yieldDepositAmount: string;
  setYieldDepositAmount: (val: string) => void;
  isCreditEngineApproved: boolean;
  handleDepositYield: (e: React.FormEvent) => void;
  yieldWithdrawAmount: string;
  setYieldWithdrawAmount: (val: string) => void;
  handleWithdrawYield: (e: React.FormEvent) => void;
  amortizeAmount: string;
  setAmortizeAmount: (val: string) => void;
  handleAmortizeDebt: (e: React.FormEvent) => void;
  effectiveKeeperBonusPercent: number;
  currentTierName: string;
  setActiveTab: (tab: TabType) => void;
  liquidateUser: string;
  setLiquidateUser: (val: string) => void;
  liquidateDebtAmount: string;
  setLiquidateDebtAmount: (val: string) => void;
  liquidateSeizeNative: boolean;
  setLiquidateSeizeNative: (val: boolean) => void;
  handleLiquidate: (e: React.FormEvent) => void;
  formatEther: (val: bigint) => string;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  mounted,
  isConnected,
  handleOpenConnectWallet,
  nativeBalance,
  tbtcBalance,
  musdBalance,
  btcPriceUSD,
  nativeCollateralEth,
  tbtcCollateralEth,
  collateralMode,
  setCollateralMode,
  collateralAmount,
  setCollateralAmount,
  handleApprove,
  isTbtcApproved,
  genericPending,
  activeAction,
  isReady,
  vaultPending,
  txStatus,
  handleDepositCollateral,
  withdrawMode,
  setWithdrawMode,
  withdrawAmount,
  setWithdrawAmount,
  maxWithdrawableEth,
  collateralEth,
  handleWithdrawCollateral,
  ltvStatusColor,
  collateralValueUSD,
  ltvNumeric,
  debtEth,
  availableBorrowUSD,
  borrowAmount,
  setBorrowAmount,
  handleBorrowMUSD,
  repayAmount,
  setRepayAmount,
  isVaultApproved,
  handleRepayMUSD,
  streamIdForAutoHeal,
  setStreamIdForAutoHeal,
  isAutoHealEligible,
  autoHealCurrentICR,
  debtToRestoreEth,
  unvestedBufferEth,
  handleAutoHealTrove,
  yieldBalance,
  yieldDepositAmount,
  setYieldDepositAmount,
  isCreditEngineApproved,
  handleDepositYield,
  yieldWithdrawAmount,
  setYieldWithdrawAmount,
  handleWithdrawYield,
  amortizeAmount,
  setAmortizeAmount,
  handleAmortizeDebt,
  effectiveKeeperBonusPercent,
  currentTierName,
  setActiveTab,
  liquidateUser,
  setLiquidateUser,
  liquidateDebtAmount,
  setLiquidateDebtAmount,
  liquidateSeizeNative,
  setLiquidateSeizeNative,
  handleLiquidate,
  formatEther,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {mounted && !isConnected && (
        <ConnectPrompt
          title="Connect Wallet to Transact"
          description="Select MetaMask, Phantom, or browser extension to manage vaults and troves."
          icon={<Shield className="w-5 h-5" />}
          onConnect={handleOpenConnectWallet}
        />
      )}

      <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MezoFlow Vault & Credit Operations</h2>
          <p className="text-xs text-[#77756F] mt-1">
            Manage Bitcoin collateral, borrow real MUSD stablecoins, amortize debt, or perform keeper liquidations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
            <span className="text-[#77756F]">Gas BTC: </span>
            <strong className="text-[#171715]">{mounted && nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : '0.0000'}</strong>
          </div>
          <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
            <span className="text-[#77756F]">Wallet tBTC: </span>
            <strong className="text-[#171715]">{mounted && tbtcBalance ? Number(formatEther(tbtcBalance as bigint)).toFixed(4) : '0.0000'}</strong>
          </div>
          <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl">
            <span className="text-[#77756F]">Wallet MUSD: </span>
            <strong className="text-[#171715]">{mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD 1: DEPOSIT & WITHDRAW COLLATERAL */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#E66C35]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Collateral Management</h3>
            </div>
            <span className="text-xs font-mono text-[#77756F]">Live Oracle: ${btcPriceUSD.toLocaleString()} / BTC</span>
          </div>

          {/* Collateral Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3]">
            <div>
              <span className="text-[#77756F] block">Native BTC Locked:</span>
              <strong className="text-[#171715] text-sm">{nativeCollateralEth.toFixed(4)} BTC</strong>
            </div>
            <div>
              <span className="text-[#77756F] block">tBTC Locked:</span>
              <strong className="text-[#171715] text-sm">{tbtcCollateralEth.toFixed(4)} tBTC</strong>
            </div>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDepositCollateral} className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="font-bold text-[#171715]">1. Deposit Bitcoin Collateral</label>
              <div className="flex space-x-1 bg-[#DEDBD3]/40 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCollateralMode('native')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${collateralMode === 'native' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                >
                  Native BTC
                </button>
                <button
                  type="button"
                  onClick={() => setCollateralMode('tbtc')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${collateralMode === 'tbtc' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                >
                  tBTC ERC-20
                </button>
              </div>
            </div>

            <input
              type="number"
              step="0.0001"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              placeholder={collateralMode === 'native' ? '0.05 BTC (Native gas token)' : '1.0 tBTC'}
              className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
            />

            {collateralMode === 'tbtc' && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleApprove('tbtc', 'vault', collateralAmount || '10')}
                  disabled={(genericPending && activeAction === 'approve_tbtc_vault') || !isReady}
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isTbtcApproved
                      ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                      : 'bg-[#E66C35] text-white animate-pulse'
                  } disabled:opacity-50`}
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_tbtc_vault'
                    ? 'Approving...'
                    : isTbtcApproved
                    ? '✓ tBTC Approved'
                    : '1. Approve tBTC'}
                </button>
                <button
                  type="submit"
                  disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0 || !isTbtcApproved}
                  className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Depositing...' : '2. Deposit tBTC'}
                </button>
              </div>
            )}

            {collateralMode === 'native' && (
              <button
                type="submit"
                disabled={(vaultPending && activeAction === 'deposit_collateral') || !isReady || !collateralAmount || Number(collateralAmount) <= 0}
                className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_collateral' ? 'Depositing...' : 'Deposit Native BTC'}
              </button>
            )}
          </form>

          {/* Withdraw Form */}
          <form onSubmit={handleWithdrawCollateral} className="space-y-4 pt-4 border-t border-[#DEDBD3]">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="font-bold text-[#171715]">2. Withdraw Collateral</label>
              <div className="flex space-x-1 bg-[#DEDBD3]/40 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setWithdrawMode('native')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${withdrawMode === 'native' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                >
                  Native BTC
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMode('tbtc')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${withdrawMode === 'tbtc' ? 'bg-[#171715] text-white' : 'text-[#77756F]'}`}
                >
                  tBTC ERC-20
                </button>
              </div>
            </div>

            <input
              type="number"
              step="0.0001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Max safe withdrawal: ${maxWithdrawableEth.toFixed(4)} BTC`}
              className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
            />

            <button
              type="submit"
              disabled={(vaultPending && activeAction === 'withdraw_collateral') || !isReady || collateralEth <= 0 || !withdrawAmount || Number(withdrawAmount) <= 0}
              className="w-full bg-[#FBFAF7] hover:bg-[#F6F4EF] border border-[#DEDBD3] text-[#171715] font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_collateral'
                ? 'Withdrawing...'
                : `Withdraw ${withdrawMode === 'native' ? 'Native BTC' : 'tBTC'}`}
            </button>
          </form>
        </div>

        {/* CARD 2: BORROW & REPAY MUSD */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-[#258454]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">MUSD Borrow & Repay</h3>
            </div>
            <span className={`text-xs font-mono font-bold ${ltvStatusColor}`}>
              LTV: {collateralValueUSD > 0 ? `${ltvNumeric.toFixed(1)}%` : '0.0%'} (Max 60%)
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3]">
            <div>
              <span className="text-[#77756F] block">Total Borrowed Debt:</span>
              <strong className="text-[#C7473A] text-sm">{debtEth.toLocaleString()} MUSD</strong>
            </div>
            <div>
              <span className="text-[#77756F] block">Available Borrow Capacity:</span>
              <strong className="text-[#258454] text-sm">${availableBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD</strong>
            </div>
          </div>

          {/* Borrow Form */}
          <form onSubmit={handleBorrowMUSD} className="space-y-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <label className="font-bold text-[#171715]">Borrow MUSD Against Collateral</label>
              <button
                type="button"
                onClick={() => setBorrowAmount(Math.floor(availableBorrowUSD).toString())}
                className="text-[#E66C35] hover:underline cursor-pointer"
              >
                Max Safe Borrow
              </button>
            </div>
            <input
              type="number"
              step="1"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="5000 MUSD"
              className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#258454]"
            />

            <button
              type="submit"
              disabled={(vaultPending && activeAction === 'borrow_musd') || !isReady || availableBorrowUSD <= 0 || !borrowAmount || Number(borrowAmount) <= 0}
              className="w-full bg-[#171715] hover:bg-[#258454] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'borrow_musd' ? 'Borrowing...' : 'Borrow MUSD Stablecoins'}
            </button>
          </form>

          {/* Repay Form */}
          <form onSubmit={handleRepayMUSD} className="space-y-4 pt-4 border-t border-[#DEDBD3]">
            <div className="flex justify-between items-center text-xs font-mono">
              <label className="font-bold text-[#171715]">Repay MUSD Debt</label>
              <button
                type="button"
                onClick={() => setRepayAmount(Math.min(debtEth, musdBalance ? Number(formatEther(musdBalance as bigint)) : 0).toString())}
                className="text-[#E66C35] hover:underline cursor-pointer"
              >
                Repay Max Debt
              </button>
            </div>
            <input
              type="number"
              step="1"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="Amount to repay"
              className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleApprove('musd', 'vault', repayAmount || '5000')}
                disabled={(genericPending && activeAction === 'approve_repay') || !isReady}
                className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isVaultApproved
                    ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                    : 'bg-[#E66C35] text-white animate-pulse'
                } disabled:opacity-50`}
              >
                {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_repay'
                  ? 'Approving...'
                  : isVaultApproved
                  ? '✓ Approved'
                  : '1. Approve MUSD'}
              </button>
              <button
                type="submit"
                disabled={(vaultPending && activeAction === 'repay_musd') || !isReady || debtEth <= 0 || !repayAmount || Number(repayAmount) <= 0 || !isVaultApproved}
                className="flex-1 bg-[#171715] hover:bg-[#258454] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'repay_musd' ? 'Repaying...' : '2. Repay Debt'}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 3: CLOSED-LOOP SELF-HEALING TROVE SHIELD */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-3 gap-2">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-5 h-5 text-[#E66C35]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">
                Closed-Loop "Self-Healing Trove" Shield
              </h3>
              <span className="text-[10px] font-mono bg-[#E66C35]/15 text-[#E66C35] px-2 py-0.5 rounded-full font-bold">
                Protocol-Aware
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#77756F]">Linked Stream:</span>
              <strong className="text-[#171715]">Stream #{streamIdForAutoHeal}</strong>
            </div>
          </div>

          {/* Status Callout Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono ${
              isAutoHealEligible
                ? 'bg-[#C7473A]/10 border-[#C7473A]/30 text-[#C7473A]'
                : 'bg-[#258454]/10 border-[#258454]/30 text-[#258454]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Activity className={`w-4 h-4 shrink-0 ${isAutoHealEligible ? 'animate-pulse' : ''}`} />
              <span>
                {isAutoHealEligible
                  ? `CRITICAL SHORTFALL DETECTED (ICR: ${autoHealCurrentICR.toFixed(1)}% < 150%). Auto-Heal is armed to reclaim unvested buffer and restore Trove health.`
                  : `TROVE SHIELD ACTIVE (ICR: ${autoHealCurrentICR > 0 ? autoHealCurrentICR.toFixed(1) : (ltvNumeric > 0 ? (10000 / ltvNumeric).toFixed(1) : '∞')}% >= 150%). Position is healthy. Auto-Heal stands by to intercept drops.`}
              </span>
            </div>
            <span className="font-bold shrink-0 uppercase tracking-wider text-[11px] px-2.5 py-1 rounded bg-white/60">
              {isAutoHealEligible ? 'Action Required' : 'Shield Armed'}
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
              <span className="text-xs font-mono text-[#77756F]">160% Target Recovery Deficit</span>
              <div className="text-lg font-mono font-bold text-[#171715]">
                {debtToRestoreEth > 0 ? `${debtToRestoreEth.toFixed(2)} MUSD` : '0.00 MUSD'}
              </div>
              <span className="text-[11px] text-[#77756F] block">Debt repayment needed to reach 160% ICR</span>
            </div>

            <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
              <span className="text-xs font-mono text-[#77756F]">Unvested Escrow Buffer</span>
              <div className="text-lg font-mono font-bold text-[#258454]">
                {unvestedBufferEth.toFixed(2)} MUSD
              </div>
              <span className="text-[11px] text-[#77756F] block">Available in Stream #{streamIdForAutoHeal}</span>
            </div>

            <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-1">
              <span className="text-xs font-mono text-[#77756F]">Worker Salary Protection</span>
              <div className="text-lg font-mono font-bold text-[#171715]">100% Inviolable</div>
              <span className="text-[11px] text-[#77756F] block">Vested salary cannot be seized or liquidated</span>
            </div>
          </div>

          {/* Auto-Heal Execution Form */}
          <form onSubmit={handleAutoHealTrove} className="bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
              <label className="font-bold text-[#171715]">
                Configure Linked Escrow Stream for Protection:
              </label>
              <div className="flex items-center space-x-1.5">
                <span className="text-[#77756F]">Select Stream ID:</span>
                <input
                  type="number"
                  min="0"
                  value={streamIdForAutoHeal}
                  onChange={(e) => setStreamIdForAutoHeal(e.target.value)}
                  className="w-16 bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-2 py-1 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                />
              </div>
            </div>

            <p className="text-xs text-[#77756F] leading-relaxed">
              When triggered, the contract reclaims only the required deficit from Stream #{streamIdForAutoHeal}'s unvested buffer to repay vault and Mezo Trove debt. 
              Employee earned earnings remain intact, and collateral is safeguarded from keeper liquidation discounts.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={!isReady || (vaultPending && activeAction === 'auto_heal_trove') || (!isAutoHealEligible && debtEth === 0)}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                  isAutoHealEligible
                    ? 'bg-[#C7473A] hover:bg-red-700 text-white shadow-md animate-pulse cursor-pointer'
                    : 'bg-[#171715] hover:bg-[#E66C35] text-white cursor-pointer'
                } disabled:opacity-50`}
              >
                <Shield className="w-4 h-4" />
                <span>
                  {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'auto_heal_trove'
                    ? 'Auto-Healing Trove...'
                    : isAutoHealEligible
                    ? 'Execute Auto-Heal Now (Defend Trove)'
                    : 'Trigger Auto-Heal (Simulate Protection)'}
                </span>
              </button>
              {!isAutoHealEligible && (
                <span className="text-[11px] font-mono text-[#77756F]">
                  ● Position currently safe. Automatically triggers if ICR drops below 150%.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* CARD 4: SELF-REPAYING CREDIT ENGINE */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DEDBD3] pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#E66C35]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Self-Repaying Credit Engine</h3>
            </div>
            <div className="text-xs font-mono text-[#77756F]">
              Unamortized Yield Balance: <strong className="text-[#258454]">{mounted && yieldBalance ? Number(formatEther(yieldBalance as bigint)).toLocaleString() : '0'} MUSD</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Deposit Yield */}
            <form onSubmit={handleDepositYield} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
              <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                <label className="font-bold text-[#171715]">Deposit Yield / Reserve</label>
                <span>MUSD: {mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'}</span>
              </div>
              <p className="text-[11px] text-[#77756F]">Deposit MUSD to fund automated debt amortization.</p>
              <input
                type="number"
                step="1"
                value={yieldDepositAmount}
                onChange={(e) => setYieldDepositAmount(e.target.value)}
                placeholder="Amount to deposit"
                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleApprove('musd', 'creditEngine', yieldDepositAmount || '5000')}
                  disabled={(genericPending && activeAction === 'approve_yield') || !isReady}
                  className={`flex-1 font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isCreditEngineApproved
                      ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                      : 'bg-[#E66C35] text-white'
                  } disabled:opacity-50`}
                >
                  {isCreditEngineApproved ? '✓ Approved' : '1. Approve'}
                </button>
                <button
                  type="submit"
                  disabled={(genericPending && activeAction === 'deposit_yield') || !isReady || !yieldDepositAmount || Number(yieldDepositAmount) <= 0 || !isCreditEngineApproved}
                  className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'deposit_yield' ? 'Depositing...' : '2. Deposit'}
                </button>
              </div>
            </form>

            {/* Withdraw Yield */}
            <form onSubmit={handleWithdrawYield} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
              <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                <label className="font-bold text-[#171715]">Reclaim Unamortized Yield</label>
                <span>Available: {mounted && yieldBalance ? Number(formatEther(yieldBalance as bigint)).toLocaleString() : '0'}</span>
              </div>
              <p className="text-[11px] text-[#77756F]">Withdraw unused yield back to your wallet at any time.</p>
              <input
                type="number"
                step="1"
                value={yieldWithdrawAmount}
                onChange={(e) => setYieldWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
              />
              <button
                type="submit"
                disabled={(genericPending && activeAction === 'withdraw_yield') || !isReady || !yieldWithdrawAmount || Number(yieldWithdrawAmount) <= 0}
                className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_yield' ? 'Withdrawing...' : 'Reclaim Yield to Wallet'}
              </button>
            </form>

            {/* Amortize Debt */}
            <form onSubmit={handleAmortizeDebt} className="space-y-3 bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
              <div className="flex justify-between items-center text-xs font-mono text-[#77756F]">
                <label className="font-bold text-[#171715]">Amortize Active Debt</label>
                <span>Debt: {debtEth.toLocaleString()} MUSD</span>
              </div>
              <p className="text-[11px] text-[#77756F]">Apply deposited yield balance to pay down loan principal.</p>
              <input
                type="number"
                step="1"
                value={amortizeAmount}
                onChange={(e) => setAmortizeAmount(e.target.value)}
                placeholder="Amount to amortize"
                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#258454]"
              />
              <button
                type="submit"
                disabled={(genericPending && activeAction === 'amortize') || !isReady || debtEth <= 0 || !yieldBalance || !amortizeAmount || Number(amortizeAmount) <= 0}
                className="w-full bg-[#258454] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'amortize' ? 'Amortizing...' : 'Amortize Vault Debt'}
              </button>
            </form>
          </div>
        </div>

        {/* CARD 5: KEEPER LIQUIDATION ENGINE */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl lg:col-span-2 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#DEDBD3] pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-[#C7473A]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Keeper Liquidation Console</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono bg-[#258454]/10 text-[#258454] px-3 py-1 rounded font-bold">
                +{effectiveKeeperBonusPercent.toFixed(1)}% Collateral Bonus ({currentTierName} Tier)
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="text-xs font-mono text-[#E66C35] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Open Arena</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-[#77756F] leading-relaxed">
            Anyone or any automated keeper bot can liquidate positions exceeding the 75% LTV threshold. 
            Liquidators repay the borrower's MUSD debt and seize the underlying Bitcoin collateral at a {effectiveKeeperBonusPercent.toFixed(1)}% bonus (instant profit).
          </p>

          <div className="bg-[#F6F4EF] border border-[#DEDBD3] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-[#77756F]">
              <Sliders className="w-4 h-4 text-[#E66C35]" />
              <span>Looking to stress test troves against simulated price crashes or trigger autonomous auto-heal?</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="px-3.5 py-1.5 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
            >
              Launch Risk Simulator & Arena →
            </button>
          </div>

          <form onSubmit={handleLiquidate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-[#F6F4EF] p-5 rounded-xl border border-[#DEDBD3]">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-mono text-[#77756F]">Borrower Address to Liquidate</label>
              <input
                type="text"
                value={liquidateUser}
                onChange={(e) => setLiquidateUser(e.target.value)}
                placeholder="0x... borrower account"
                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#C7473A]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#77756F]">Debt to Repay (MUSD)</label>
              <input
                type="number"
                step="1"
                value={liquidateDebtAmount}
                onChange={(e) => setLiquidateDebtAmount(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-xl px-4 py-2.5 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#C7473A]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#77756F]">
                <input
                  type="checkbox"
                  id="seizeNative"
                  checked={liquidateSeizeNative}
                  onChange={(e) => setLiquidateSeizeNative(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="seizeNative" className="cursor-pointer">Seize Native BTC</label>
              </div>
              <button
                type="submit"
                disabled={(vaultPending && activeAction === 'liquidate') || !isReady || !liquidateUser || !liquidateDebtAmount}
                className="w-full bg-[#C7473A] hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {(vaultPending || txStatus === 'wallet_confirm') && activeAction === 'liquidate' ? 'Liquidating...' : 'Execute Liquidation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
