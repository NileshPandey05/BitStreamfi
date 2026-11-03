import React from 'react';
import { Clock, ArrowRightLeft } from 'lucide-react';
import { ConnectPrompt } from '../ui/ConnectPrompt';
import { ActiveAction, TxStatus } from '../../types';

interface PayrollTabProps {
  mounted: boolean;
  isConnected: boolean;
  handleOpenConnectWallet: () => void;
  musdBalance: any;
  formatEther: (val: bigint) => string;
  recipient: string;
  setRecipient: (val: string) => void;
  streamDeposit: string;
  setStreamDeposit: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  handleCreateStream: (e: React.FormEvent) => void;
  handleApprove: (token: 'musd' | 'tbtc' | 'mezo', spenderName: 'streamer' | 'vault' | 'creditEngine' | 'stakingBoost', amount: string) => void;
  isStreamerApproved: boolean;
  streamerPending: boolean;
  genericPending: boolean;
  txStatus: TxStatus;
  activeAction: ActiveAction;
  isReady: boolean;
  streamIdToManage: string;
  setStreamIdToManage: (val: string) => void;
  streamExists: boolean;
  streamIsActive: boolean;
  streamEmployer?: string;
  streamRecipient?: string;
  isCurrentUserEmployer: boolean;
  isCurrentUserRecipient: boolean;
  streamDepositAmount: number;
  claimableEth: number;
  streamProgressPercent: number;
  isSplitEnabled: boolean;
  currentSplitBps: number;
  currentSplitTarget?: string;
  splitPercent: string;
  setSplitPercent: (val: string) => void;
  splitTargetBorrower: string;
  setSplitTargetBorrower: (val: string) => void;
  handleSetStreamSplit: (e: React.FormEvent) => void;
  handleWithdrawStream: () => void;
  topUpAmount: string;
  setTopUpAmount: (val: string) => void;
  handleTopUpStream: (e: React.FormEvent) => void;
  handleCancelStream: () => void;
  formatAddress: (addr?: string) => string;
  address?: string;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  mounted,
  isConnected,
  handleOpenConnectWallet,
  musdBalance,
  formatEther,
  recipient,
  setRecipient,
  streamDeposit,
  setStreamDeposit,
  duration,
  setDuration,
  handleCreateStream,
  handleApprove,
  isStreamerApproved,
  streamerPending,
  genericPending,
  txStatus,
  activeAction,
  isReady,
  streamIdToManage,
  setStreamIdToManage,
  streamExists,
  streamIsActive,
  streamEmployer,
  streamRecipient,
  isCurrentUserEmployer,
  isCurrentUserRecipient,
  streamDepositAmount,
  claimableEth,
  streamProgressPercent,
  isSplitEnabled,
  currentSplitBps,
  currentSplitTarget,
  splitPercent,
  setSplitPercent,
  splitTargetBorrower,
  setSplitTargetBorrower,
  handleSetStreamSplit,
  handleWithdrawStream,
  topUpAmount,
  setTopUpAmount,
  handleTopUpStream,
  handleCancelStream,
  formatAddress,
  address,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {mounted && !isConnected && (
        <ConnectPrompt
          title="Connect Wallet to Stream Payroll"
          description="Choose your preferred wallet to create second-by-second MUSD salary streams on Mezo."
          icon={<Clock className="w-5 h-5" />}
          onConnect={handleOpenConnectWallet}
        />
      )}

      <div className="border-b border-[#DEDBD3] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-display font-bold text-[#171715]">MUSD Payroll Streamer</h2>
          <p className="text-xs text-[#77756F] mt-1">
            Second-by-second linear escrow streaming of official testnet MUSD stablecoins backed by Bitcoin.
          </p>
        </div>
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl text-xs font-mono">
          <span className="text-[#77756F]">Available MUSD: </span>
          <strong className="text-[#258454]">
            {mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'} MUSD
          </strong>
        </div>
      </div>

      <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-5 rounded-2xl flex items-start space-x-3.5 text-xs font-mono shadow-sm">
        <div className="bg-[#E66C35]/10 p-2 rounded-xl text-[#E66C35] shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <p className="font-bold text-[#171715] text-sm">How Second-by-Second Streaming Works</p>
          <p className="text-[#77756F] leading-relaxed">
            When you create a stream, deposited <strong>MUSD</strong> is held in the non-custodial <strong>PayrollStreamer</strong> contract.
            Funds unlock smoothly second-by-second into the recipient's claimable balance. 
            The employee can withdraw anytime via <strong>"Claim Earned MUSD"</strong>, while the employer maintains full top-up and revocation controls with unearned refund splits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Stream Form */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715] mb-2 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#E66C35]" />
              <span>Create MUSD Salary Stream</span>
            </h3>
            <p className="text-xs text-[#77756F] mb-6">Deposit MUSD for continuous linear vesting.</p>
            
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-[#77756F]">Recipient Address</label>
                  {address && (
                    <button
                      type="button"
                      onClick={() => setRecipient(address)}
                      className="text-[11px] font-mono text-[#E66C35] hover:underline cursor-pointer"
                    >
                      Use Connected Wallet
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x... recipient address"
                  className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-xs focus:outline-none focus:border-[#E66C35]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#77756F] block mb-1">Deposit Amount (MUSD)</label>
                <input
                  type="number"
                  step="1"
                  value={streamDeposit}
                  onChange={(e) => setStreamDeposit(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-[#77756F]">Duration (Seconds)</label>
                  <div className="flex space-x-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setDuration('3600')}
                      className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715] cursor-pointer"
                    >
                      1h
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('86400')}
                      className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715] cursor-pointer"
                    >
                      1d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('2592000')}
                      className="px-1.5 py-0.5 rounded bg-[#DEDBD3]/40 hover:bg-[#DEDBD3] text-[#171715] cursor-pointer"
                    >
                      30d
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3600 (1 hour)"
                  className="w-full bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-4 py-3 text-[#171715] font-mono text-sm focus:outline-none focus:border-[#E66C35]"
                />
              </div>

              {Number(streamDeposit) > 0 && Number(duration) > 0 && (
                <div className="text-[11px] font-mono text-[#77756F] bg-[#F6F4EF] p-2.5 rounded-xl border border-[#DEDBD3] flex justify-between">
                  <span>Streaming Rate:</span>
                  <span className="text-[#171715] font-semibold">
                    {(Number(streamDeposit) / Number(duration)).toFixed(6)} MUSD / sec
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleApprove('musd', 'streamer', streamDeposit || '1000')}
                  disabled={(genericPending && activeAction === 'approve_stream') || !isReady}
                  className={`flex-1 font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer ${
                    isStreamerApproved
                      ? 'bg-[#258454]/10 border border-[#258454]/40 text-[#258454]'
                      : 'bg-[#E66C35] text-white animate-pulse'
                  } disabled:opacity-50`}
                >
                  {(genericPending || txStatus === 'wallet_confirm') && activeAction === 'approve_stream'
                    ? 'Approving...'
                    : isStreamerApproved
                    ? '✓ MUSD Approved'
                    : '1. Approve MUSD'}
                </button>
                <button
                  type="submit"
                  disabled={
                    (streamerPending && activeAction === 'create_stream') ||
                    !isReady ||
                    !recipient ||
                    !streamDeposit ||
                    !duration ||
                    !isStreamerApproved
                  }
                  className="flex-1 bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'create_stream' ? 'Creating...' : '2. Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stream Management */}
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-7 rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171715]">Stream Management</h3>
              <div className="flex items-center space-x-1.5">
                <label className="text-xs font-mono text-[#77756F]">Stream ID:</label>
                <input
                  type="number"
                  min="0"
                  value={streamIdToManage}
                  onChange={(e) => setStreamIdToManage(e.target.value)}
                  className="w-16 bg-[#F6F4EF] border border-[#DEDBD3] rounded-lg px-2 py-1 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                />
              </div>
            </div>

            {streamExists ? (
              <div className="space-y-4">
                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Status:</span>
                    <span className={`font-bold ${streamIsActive ? 'text-[#258454]' : 'text-[#C7473A]'}`}>
                      {streamIsActive ? '● Streaming (Active)' : '○ Completed / Cancelled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Employer:</span>
                    <span className="text-[#171715]">{formatAddress(streamEmployer)} {isCurrentUserEmployer ? '(You)' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Recipient:</span>
                    <span className="text-[#171715]">{formatAddress(streamRecipient)} {isCurrentUserRecipient ? '(You)' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Total Deposited:</span>
                    <span className="font-bold text-[#171715]">{streamDepositAmount.toLocaleString()} MUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77756F]">Claimable Now:</span>
                    <span className="font-bold text-[#258454]">{claimableEth.toFixed(4)} MUSD</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-[#77756F]">
                      <span>Vesting Progress</span>
                      <span>{streamProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#DEDBD3] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#258454] h-full rounded-full transition-all duration-500" style={{ width: `${streamProgressPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Wave 2: Stream-to-Debt Amortization Split Configuration */}
                <div className="bg-[#F6F4EF] p-4 rounded-xl border border-[#DEDBD3] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171715] flex items-center space-x-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#E66C35]" />
                      <span>Stream-to-Debt Amortization</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isSplitEnabled && currentSplitBps > 0
                          ? 'bg-[#258454]/15 text-[#258454]'
                          : 'bg-[#77756F]/15 text-[#77756F]'
                      }`}
                    >
                      {isSplitEnabled && currentSplitBps > 0
                        ? `${(currentSplitBps / 100).toFixed(0)}% Auto-Repay Active`
                        : 'Split Inactive'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#77756F] leading-relaxed">
                    Recipients can automatically allocate up to 50% of claimed salary to amortize vault debt (theirs or their employer's), lowering liquidation risk on every paycheck.
                  </p>

                  {isCurrentUserRecipient && streamIsActive ? (
                    <form onSubmit={handleSetStreamSplit} className="space-y-3 pt-2 border-t border-[#DEDBD3]">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <label className="text-[#77756F]">Amortization Split %</label>
                          <div className="flex space-x-1">
                            {['0', '10', '20', '30', '50'].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setSplitPercent(p)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  splitPercent === p ? 'bg-[#171715] text-white' : 'bg-[#DEDBD3]/50 text-[#171715]'
                                }`}
                              >
                                {p}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={splitPercent}
                          onChange={(e) => setSplitPercent(e.target.value)}
                          className="w-full accent-[#E66C35] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <label className="text-[#77756F]">Target Borrower Account</label>
                          {streamEmployer && (
                            <button
                              type="button"
                              onClick={() => setSplitTargetBorrower(streamEmployer)}
                              className="text-[#E66C35] hover:underline cursor-pointer"
                            >
                              Use Employer ({formatAddress(streamEmployer)})
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={splitTargetBorrower}
                          onChange={(e) => setSplitTargetBorrower(e.target.value)}
                          placeholder={address ? `Default: ${formatAddress(address)} (You)` : '0x... borrower account'}
                          className="w-full bg-[#FBFAF7] border border-[#DEDBD3] rounded-lg px-3 py-1.5 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={(streamerPending && activeAction === 'set_stream_split') || !isReady}
                        className="w-full bg-[#171715] hover:bg-[#E66C35] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'set_stream_split'
                          ? 'Configuring Split...'
                          : `Save ${splitPercent}% Debt Amortization Split`}
                      </button>
                    </form>
                  ) : (
                    <div className="text-[11px] text-[#77756F]">
                      {isSplitEnabled && currentSplitBps > 0 ? (
                        <p>
                          Current Split: <strong>{(currentSplitBps / 100).toFixed(0)}%</strong> of claim will automatically repay debt for{' '}
                          <strong className="text-[#171715]">{formatAddress(currentSplitTarget)}</strong>.
                        </p>
                      ) : (
                        <p>No debt amortization split configured for this stream.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recipient Claim Action */}
                {isCurrentUserRecipient && streamIsActive && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleWithdrawStream}
                      disabled={(streamerPending && activeAction === 'withdraw_stream') || !isReady || claimableEth <= 0}
                      className="w-full bg-[#258454] hover:opacity-90 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_stream'
                        ? 'Claiming...'
                        : isSplitEnabled && currentSplitBps > 0
                        ? `Claim Earned MUSD (${((claimableEth * (10000 - currentSplitBps)) / 10000).toFixed(4)} Wallet + ${((claimableEth * currentSplitBps) / 10000).toFixed(4)} Debt)`
                        : `Claim Earned MUSD (${claimableEth.toFixed(4)} Available)`}
                    </button>
                    {isSplitEnabled && currentSplitBps > 0 && claimableEth > 0 && (
                      <p className="text-[10px] text-center font-mono text-[#77756F]">
                        ✓ Automatic closed loop: {((claimableEth * currentSplitBps) / 10000).toFixed(4)} MUSD amortizes debt for {formatAddress(currentSplitTarget)} on-chain.
                      </p>
                    )}
                  </div>
                )}

                {/* Employer Top Up */}
                {isCurrentUserEmployer && streamIsActive && (
                  <form onSubmit={handleTopUpStream} className="flex space-x-2">
                    <input
                      type="number"
                      step="1"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="Add MUSD"
                      className="flex-1 bg-[#F6F4EF] border border-[#DEDBD3] rounded-xl px-3 py-2 text-xs font-mono text-[#171715] focus:outline-none focus:border-[#E66C35]"
                    />
                    <button
                      type="submit"
                      disabled={(streamerPending && activeAction === 'top_up_stream') || !isReady || !topUpAmount || Number(topUpAmount) <= 0}
                      className="bg-[#171715] hover:bg-[#E66C35] text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'top_up_stream' ? 'Adding...' : 'Top Up'}
                    </button>
                  </form>
                )}

                {/* Cancel Stream */}
                {(isCurrentUserEmployer || isCurrentUserRecipient) && streamIsActive && (
                  <button
                    type="button"
                    onClick={handleCancelStream}
                    disabled={(streamerPending && activeAction === 'cancel_stream') || !isReady}
                    className="w-full bg-[#C7473A]/10 hover:bg-[#C7473A]/20 border border-[#C7473A]/30 text-[#C7473A] font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_stream'
                      ? 'Revoking...'
                      : 'Cancel Stream (Earned to Recipient, Balance to Employer)'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-[#F6F4EF] p-8 rounded-xl border border-[#DEDBD3] text-center space-y-2">
                <p className="text-xs font-mono text-[#77756F]">Stream #{streamIdToManage} not yet initialized on Mezo L2.</p>
                <p className="text-[11px] text-[#77756F]">Create a new stream on the left or enter an active Stream ID.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
