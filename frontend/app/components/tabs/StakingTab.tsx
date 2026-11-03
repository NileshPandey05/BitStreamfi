import React from 'react';
import { Award, Zap, DollarSign, Layers } from 'lucide-react';
import { ConnectPrompt } from '../ui/ConnectPrompt';
import { ActiveAction, TxStatus } from '../../types';

interface StakingTabProps {
  mounted: boolean;
  isConnected: boolean;
  handleOpenConnectWallet: () => void;
  mezoBalanceEth: number;
  userStakedMezo: number;
  totalStakedMezo: number;
  currentTierName: string;
  feeDiscountPercent: number;
  keeperBoostPercent: number;
  earnedRewardsEth: number;
  stakingTab: 'stake' | 'unstake' | 'rewards';
  setStakingTab: (tab: 'stake' | 'unstake' | 'rewards') => void;
  mezoStakeAmount: string;
  setMezoStakeAmount: (val: string) => void;
  mezoUnstakeAmount: string;
  setMezoUnstakeAmount: (val: string) => void;
  handleApprove: (token: 'musd' | 'tbtc' | 'mezo', spenderName: 'streamer' | 'vault' | 'creditEngine' | 'stakingBoost', amount: string) => void;
  handleStakeMEZO: (e: React.FormEvent) => void;
  handleInitiateUnstake: (e: React.FormEvent) => void;
  handleClaimUnstaked: () => void;
  handleCancelUnstake: () => void;
  handleClaimStakingRewards: () => void;
  isMezoApproved: boolean;
  genericPending: boolean;
  txStatus: TxStatus;
  activeAction: ActiveAction;
  isReady: boolean;
  unbondingAmountEth: number;
  isUnbondingReady: boolean;
  unbondingReleaseTime: number;
}

export const StakingTab: React.FC<StakingTabProps> = ({
  mounted,
  isConnected,
  handleOpenConnectWallet,
  mezoBalanceEth,
  userStakedMezo,
  totalStakedMezo,
  currentTierName,
  feeDiscountPercent,
  keeperBoostPercent,
  earnedRewardsEth,
  stakingTab,
  setStakingTab,
  mezoStakeAmount,
  setMezoStakeAmount,
  mezoUnstakeAmount,
  setMezoUnstakeAmount,
  handleApprove,
  handleStakeMEZO,
  handleInitiateUnstake,
  handleClaimUnstaked,
  handleCancelUnstake,
  handleClaimStakingRewards,
  isMezoApproved,
  genericPending,
  txStatus,
  activeAction,
  isReady,
  unbondingAmountEth,
  isUnbondingReady,
  unbondingReleaseTime,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn text-[#F4F3EF]">
      {mounted && !isConnected && (
        <ConnectPrompt
          title="Connect Wallet to Stake MEZO"
          description="Connect your wallet to lock MEZO tokens, lower vault borrowing fees, and earn protocol revenue."
          icon={<Award className="w-5 h-5 text-[#FF7A7A]" />}
          onConnect={handleOpenConnectWallet}
        />
      )}

      {/* Header Title & Top Metrics */}
      <div className="border-b border-[#26252C] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-serif-display font-bold text-[#F4F3EF] flex items-center space-x-2">
              <span>MEZO Governance Staking Boost</span>
              <span className="text-xs font-serif text-[#C5A059] italic font-normal tracking-normal">利回り増強</span>
            </h2>
            <span className="text-[10px] font-mono bg-[#D43838]/15 text-[#FF7A7A] border border-[#D43838]/30 px-2 py-0.5 rounded-full font-bold">
              Dual-Token Utility
            </span>
          </div>
          <p className="text-xs text-[#9A978F] mt-1 font-mono">
            Lock official MEZO tokens to slash vault borrow fees up to 50%, boost keeper liquidation bonuses, and claim pro-rata MUSD dividends.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-[#121216] border border-[#26252C] px-3.5 py-2 rounded-xl">
            <span className="text-[#9A978F]">Wallet MEZO: </span>
            <strong className="text-[#F4F3EF]">{mounted ? mezoBalanceEth.toFixed(2) : '0.00'}</strong>
          </div>
          <div className="bg-[#121216] border border-[#26252C] px-3.5 py-2 rounded-xl">
            <span className="text-[#9A978F]">Your Staked: </span>
            <strong className="text-[#FF7A7A]">{mounted ? userStakedMezo.toFixed(2) : '0.00'}</strong>
          </div>
          <div className="bg-[#121216] border border-[#26252C] px-3.5 py-2 rounded-xl">
            <span className="text-[#9A978F]">Total Staked: </span>
            <strong className="text-[#34D399]">{mounted ? totalStakedMezo.toFixed(2) : '0.00'}</strong>
          </div>
        </div>
      </div>

      {/* User Tier Status Hero Card */}
      <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                currentTierName === 'Gold'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : currentTierName === 'Silver'
                  ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                  : currentTierName === 'Bronze'
                  ? 'bg-[#D43838]/20 text-[#FF7A7A] border border-[#D43838]/40 shadow-[0_0_15px_rgba(212,56,56,0.2)]'
                  : 'bg-[#18181E] text-[#9A978F] border border-[#26252C]'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9A978F]">Active Staking Tier</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                    currentTierName === 'Gold'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : currentTierName === 'Silver'
                      ? 'bg-slate-400/25 text-slate-200 border-slate-400/30'
                      : currentTierName === 'Bronze'
                      ? 'bg-[#D43838]/25 text-[#FF7A7A] border-[#D43838]/30'
                      : 'bg-[#18181E] text-[#9A978F] border-[#26252C]'
                  }`}
                >
                  {currentTierName} Tier
                </span>
              </div>
              <h3 className="text-xl font-serif-display font-bold text-[#F4F3EF] mt-0.5">
                {currentTierName === 'Gold'
                  ? 'Gold Member (Max 50% Borrow Discount + 2.5% Keeper Boost)'
                  : currentTierName === 'Silver'
                  ? 'Silver Member (30% Borrow Discount + 1.0% Keeper Boost)'
                  : currentTierName === 'Bronze'
                  ? 'Bronze Member (15% Vault Borrowing Discount)'
                  : 'Standard Tier (Stake MEZO to Unlock Fee Discounts)'}
              </h3>
            </div>
          </div>

          <div className="text-right text-xs font-mono">
            <span className="text-[#9A978F] block">Next Tier Target:</span>
            <strong className="text-[#F4F3EF]">
              {userStakedMezo < 100
                ? `${(100 - userStakedMezo).toFixed(0)} MEZO to Bronze`
                : userStakedMezo < 500
                ? `${(500 - userStakedMezo).toFixed(0)} MEZO to Silver`
                : userStakedMezo < 2500
                ? `${(2500 - userStakedMezo).toFixed(0)} MEZO to Gold`
                : 'Max Tier Achieved'}
            </strong>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-[#9A978F]">
            <span>Tier Progression</span>
            <span>{userStakedMezo.toFixed(0)} / 2,500 MEZO</span>
          </div>
          <div className="w-full bg-[#0A0A0C] h-2.5 rounded-full overflow-hidden border border-[#26252C]">
            <div
              className="bg-gradient-to-r from-[#D43838] to-[#C5A059] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(212,56,56,0.35)]"
              style={{ width: `${Math.min(100, Math.round((userStakedMezo / 2500) * 100))}%` }}
            />
          </div>
        </div>

        {/* 3 Active Benefit Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1 font-mono">
            <span className="text-xs text-[#9A978F]">Borrow Fee Discount</span>
            <div className="text-xl font-bold text-[#34D399]">{feeDiscountPercent.toFixed(1)}% OFF</div>
            <span className="text-[11px] text-[#9A978F] block">Deducted from base 0.50% vault fee</span>
          </div>

          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1 font-mono">
            <span className="text-xs text-[#9A978F]">Keeper Bonus Boost</span>
            <div className="text-xl font-bold text-[#FF7A7A]">+{keeperBoostPercent.toFixed(1)}% EXTRA</div>
            <span className="text-[11px] text-[#9A978F] block">Total {5 + keeperBoostPercent}% liquidation profit</span>
          </div>

          <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-1 font-mono">
            <span className="text-xs text-[#9A978F]">Accrued MUSD Dividends</span>
            <div className="text-xl font-bold text-[#F4F3EF]">{earnedRewardsEth.toFixed(4)} MUSD</div>
            <span className="text-[11px] text-[#9A978F] block">Pro-rata share of vault origination fees</span>
          </div>
        </div>
      </div>

      {/* Interactive 2-Column Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUMN 1: STAKE / UNSTAKE ACTIONS */}
        <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#26252C] pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#D43838]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF]">Staking Console</h3>
            </div>
            <div className="flex space-x-1 bg-[#0A0A0C] p-1 rounded-lg border border-[#26252C] text-xs font-mono">
              <button
                type="button"
                onClick={() => setStakingTab('stake')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  stakingTab === 'stake' ? 'bg-[#D43838] text-white shadow-xs' : 'text-[#9A978F] hover:text-[#F4F3EF]'
                }`}
              >
                Stake
              </button>
              <button
                type="button"
                onClick={() => setStakingTab('unstake')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  stakingTab === 'unstake' ? 'bg-[#D43838] text-white shadow-xs' : 'text-[#9A978F] hover:text-[#F4F3EF]'
                }`}
              >
                Unstake (Cooldown)
              </button>
            </div>
          </div>

          {stakingTab === 'stake' ? (
            <form onSubmit={handleStakeMEZO} className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <label className="font-bold text-[#F4F3EF]">Amount of MEZO to Stake</label>
                <span className="text-[#9A978F]">Available: {mezoBalanceEth.toFixed(2)} MEZO</span>
              </div>

              <input
                type="number"
                step="1"
                value={mezoStakeAmount}
                onChange={(e) => setMezoStakeAmount(e.target.value)}
                placeholder="e.g. 500 MEZO for Silver Tier"
                className="w-full bg-[#0A0A0C] border border-[#26252C] rounded-xl px-4 py-3 text-[#F4F3EF] font-mono text-sm focus:outline-none focus:border-[#D43838]"
              />

              {/* Quick Preset Buttons */}
              <div className="flex space-x-2 text-xs font-mono">
                {[
                  { label: '100 (Bronze)', val: '100' },
                  { label: '500 (Silver)', val: '500' },
                  { label: '2,500 (Gold)', val: '2500' },
                  { label: 'Max', val: mezoBalanceEth.toString() },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setMezoStakeAmount(preset.val)}
                    className="flex-1 bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] py-1.5 rounded-lg text-[11px] font-semibold text-[#F4F3EF] transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApprove('mezo', 'stakingBoost', mezoStakeAmount || '500')}
                  disabled={(genericPending && activeAction === 'approve_mezo') || !isReady}
                  className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer ${
                    isMezoApproved
                      ? 'bg-[#34D399]/10 border border-[#34D399]/40 text-[#34D399]'
                      : 'bg-[#D43838] text-white shadow-[0_0_15px_rgba(212,56,56,0.3)] animate-pulse'
                  } disabled:opacity-50`}
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_mezo'
                    ? 'Approving...'
                    : isMezoApproved
                    ? '✓ MEZO Approved'
                    : '1. Approve MEZO'}
                </button>

                <button
                  type="submit"
                  disabled={
                    (genericPending && activeAction === 'stake_mezo') ||
                    !isReady ||
                    !mezoStakeAmount ||
                    Number(mezoStakeAmount) <= 0 ||
                    !isMezoApproved
                  }
                  className="flex-1 bg-[#D43838] hover:bg-[#E24A4A] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,56,56,0.25)]"
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'stake_mezo'
                    ? 'Staking...'
                    : '2. Stake MEZO'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleInitiateUnstake} className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="font-bold text-[#F4F3EF]">Amount of MEZO to Unstake</label>
                  <span className="text-[#9A978F]">Staked: {userStakedMezo.toFixed(2)} MEZO</span>
                </div>

                <input
                  type="number"
                  step="1"
                  value={mezoUnstakeAmount}
                  onChange={(e) => setMezoUnstakeAmount(e.target.value)}
                  placeholder="Amount to unbond"
                  className="w-full bg-[#0A0A0C] border border-[#26252C] rounded-xl px-4 py-3 text-[#F4F3EF] font-mono text-sm focus:outline-none focus:border-[#D43838]"
                />

                <p className="text-[11px] font-mono text-[#9A978F] leading-relaxed">
                  Notice: Unstaking triggers a <strong>2-day cooldown period</strong> to protect protocol stability. 
                  Funds in cooldown no longer earn fee discounts or revenue share.
                </p>

                <button
                  type="submit"
                  disabled={
                    (genericPending && activeAction === 'initiate_unstake') ||
                    !isReady ||
                    !mezoUnstakeAmount ||
                    Number(mezoUnstakeAmount) <= 0 ||
                    userStakedMezo < Number(mezoUnstakeAmount) ||
                    unbondingAmountEth > 0
                  }
                  className="w-full bg-[#EF4444] hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'initiate_unstake'
                    ? 'Initiating...'
                    : 'Initiate Unstake (Start 2-Day Cooldown)'}
                </button>
              </form>

              {/* Pending Unbonding Status Box */}
              {unbondingAmountEth > 0 && (
                <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#F4F3EF]">Pending Unbonding Request</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isUnbondingReady ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30' : 'bg-[#D43838]/15 text-[#FF7A7A] border-[#D43838]/30'}`}>
                      {isUnbondingReady ? 'Ready to Claim' : 'In Cooldown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Unbonding Amount:</span>
                    <strong className="text-[#F4F3EF]">{unbondingAmountEth.toFixed(2)} MEZO</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Release Date:</span>
                    <span className="text-[#9A978F]">{new Date(unbondingReleaseTime * 1000).toLocaleString()}</span>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleClaimUnstaked}
                      disabled={(genericPending && activeAction === 'claim_unstaked') || !isReady || !isUnbondingReady}
                      className="flex-1 bg-[#34D399] hover:bg-[#2BB882] text-[#0A0A0C] font-bold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'claim_unstaked'
                        ? 'Claiming...'
                        : 'Claim to Wallet'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelUnstake}
                      disabled={(genericPending && activeAction === 'cancel_unstake') || !isReady}
                      className="flex-1 bg-[#18181E] hover:bg-[#22222B] text-[#F4F3EF] border border-[#26252C] font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_unstake'
                        ? 'Restaking...'
                        : 'Cancel & Restake'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 2: REAL YIELD MUSD DIVIDENDS */}
        <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-[#26252C] pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-[#34D399]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF]">MUSD Protocol Dividends</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 px-2 py-0.5 rounded font-bold">
                Real Yield
              </span>
            </div>

            <p className="text-xs text-[#9A978F] leading-relaxed mt-4">
              Borrowing fees collected across all active MezoFlow Vault positions are channelled directly into the staking reward accumulator. 
              MEZO stakers earn non-inflationary MUSD stablecoins backed by Bitcoin without token dilution.
            </p>

            <div className="bg-[#0A0A0C] p-6 rounded-xl border border-[#26252C] my-6 text-center space-y-2">
              <span className="text-xs font-mono text-[#9A978F] uppercase tracking-wider">Your Claimable Revenue Share</span>
              <div className="text-4xl font-mono font-bold text-[#34D399]">
                {earnedRewardsEth.toFixed(4)} <span className="text-lg text-[#F4F3EF]">MUSD</span>
              </div>
              <p className="text-[11px] font-mono text-[#9A978F]">
                Accrued from vault loan origination fees on Mezo L2
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClaimStakingRewards}
            disabled={(genericPending && activeAction === 'claim_staking_rewards') || !isReady || earnedRewardsEth <= 0}
            className="w-full bg-[#34D399] hover:bg-[#2BB882] text-[#0A0A0C] font-bold py-3.5 rounded-xl text-xs transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer"
          >
            {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'claim_staking_rewards'
              ? 'Claiming Dividends...'
              : `Claim ${earnedRewardsEth.toFixed(4)} MUSD Dividends`}
          </button>
        </div>
      </div>

      {/* FULL WIDTH: TIER PERKS COMPARISON MATRIX */}
      <div className="bg-[#121216] border border-[#26252C] rounded-2xl p-7 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF] flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#C5A059]" />
          <span>MEZO Staking Tier Matrix & Protocol Privileges</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0A0C] border-b border-[#26252C] text-[#9A978F]">
              <tr>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">MEZO Required</th>
                <th className="py-3 px-4">Borrow Fee Discount</th>
                <th className="py-3 px-4">Effective Vault Fee</th>
                <th className="py-3 px-4">Keeper Liquidation Bonus</th>
                <th className="py-3 px-4">Stream Cancellation Penalty</th>
                <th className="py-3 px-4 text-right">Dividend Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26252C]">
              <tr className={currentTierName === 'Standard' ? 'bg-[#D43838]/10 font-bold' : ''}>
                <td className="py-3.5 px-4 text-[#F4F3EF]">Standard</td>
                <td className="py-3.5 px-4">0 MEZO</td>
                <td className="py-3.5 px-4 text-[#9A978F]">0%</td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">0.50%</td>
                <td className="py-3.5 px-4 text-[#9A978F]">5.0% (Standard)</td>
                <td className="py-3.5 px-4 text-[#9A978F]">Standard Escrow Rules</td>
                <td className="py-3.5 px-4 text-right text-[#9A978F]">None</td>
              </tr>
              <tr className={currentTierName === 'Bronze' ? 'bg-[#D43838]/10 font-bold' : ''}>
                <td className="py-3.5 px-4 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D43838]" />
                  <span className="text-[#FF7A7A]">Bronze</span>
                </td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">100 MEZO</td>
                <td className="py-3.5 px-4 text-[#34D399]">15% Discount</td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">0.425%</td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">5.0%</td>
                <td className="py-3.5 px-4 text-[#9A978F]">Standard Escrow Rules</td>
                <td className="py-3.5 px-4 text-right text-[#34D399]">Pro-Rata</td>
              </tr>
              <tr className={currentTierName === 'Silver' ? 'bg-[#D43838]/10 font-bold' : ''}>
                <td className="py-3.5 px-4 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-slate-200">Silver</span>
                </td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">500 MEZO</td>
                <td className="py-3.5 px-4 text-[#34D399]">30% Discount</td>
                <td className="py-3.5 px-4 text-[#F4F3EF]">0.350%</td>
                <td className="py-3.5 px-4 text-[#FF7A7A]">6.0% (+1.0% Boost)</td>
                <td className="py-3.5 px-4 text-[#9A978F]">Standard Escrow Rules</td>
                <td className="py-3.5 px-4 text-right text-[#34D399]">Pro-Rata</td>
              </tr>
              <tr className={currentTierName === 'Gold' ? 'bg-[#D43838]/10 font-bold' : ''}>
                <td className="py-3.5 px-4 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300">Gold</span>
                </td>
                <td className="py-3.5 px-4 text-amber-300 font-bold">2,500 MEZO</td>
                <td className="py-3.5 px-4 text-[#34D399] font-bold">50% Max Discount</td>
                <td className="py-3.5 px-4 font-bold text-[#F4F3EF]">0.250%</td>
                <td className="py-3.5 px-4 text-[#FF7A7A] font-bold">7.5% (+2.5% Boost)</td>
                <td className="py-3.5 px-4 text-[#34D399] font-bold">Zero Cancellation Fee</td>
                <td className="py-3.5 px-4 text-right text-[#34D399] font-bold">Max Pro-Rata Weight</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
