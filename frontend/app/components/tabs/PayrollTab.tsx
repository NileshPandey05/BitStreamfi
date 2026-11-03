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
    <div className="space-y-8 animate-fadeIn text-[#F4F3EF]">
      {mounted && !isConnected && (
        <ConnectPrompt
          title="Connect Wallet to Stream Payroll"
          description="Choose your preferred wallet to create second-by-second MUSD salary streams on Mezo."
          icon={<Clock className="w-5 h-5 text-[#FF7A7A]" />}
          onConnect={handleOpenConnectWallet}
        />
      )}

      {/* Header Bar */}
      <div className="border-b border-[#26252C] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif-display font-bold text-[#F4F3EF] flex items-center space-x-2">
            <span>MUSD Continuous Payroll Streamer</span>
            <span className="text-xs font-serif text-[#C5A059] italic font-normal tracking-normal">水流給与</span>
          </h2>
          <p className="text-xs text-[#9A978F] mt-1 font-mono">
            Second-by-second linear escrow streaming of official testnet MUSD stablecoins backed by Bitcoin.
          </p>
        </div>
        <div className="bg-[#121216] border border-[#26252C] px-3.5 py-2 rounded-xl text-xs font-mono">
          <span className="text-[#9A978F]">Available MUSD: </span>
          <strong className="text-[#34D399]">
            {mounted && musdBalance ? Number(formatEther(musdBalance as bigint)).toLocaleString() : '0'} MUSD
          </strong>
        </div>
      </div>

      {/* Educational Banner */}
      <div className="bg-[#121216] border border-[#26252C] p-5 rounded-2xl flex items-start space-x-3.5 text-xs font-mono shadow-sm">
        <div className="bg-[#D43838]/15 border border-[#D43838]/30 p-2 rounded-xl text-[#FF7A7A] shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <p className="font-bold text-[#F4F3EF] text-sm font-serif">How Continuous Streaming Works (川流の仕組み)</p>
          <p className="text-[#9A978F] leading-relaxed">
            When you create a stream, deposited <strong>MUSD</strong> is held in the non-custodial <strong>PayrollStreamer</strong> contract.
            Funds unlock smoothly second-by-second into the recipient's claimable balance. 
            The employee can withdraw anytime via <strong>"Claim Earned MUSD"</strong>, while the employer maintains full top-up and revocation controls with unearned refund splits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Stream Form */}
        <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF] mb-2 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#D43838]" />
              <span>Create MUSD Salary Stream</span>
            </h3>
            <p className="text-xs text-[#9A978F] mb-6">Deposit MUSD for continuous linear vesting.</p>
            
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-[#9A978F]">Recipient Address</label>
                  {address && (
                    <button
                      type="button"
                      onClick={() => setRecipient(address)}
                      className="text-[11px] font-mono text-[#FF7A7A] hover:underline cursor-pointer"
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
                  className="w-full bg-[#0A0A0C] border border-[#26252C] rounded-xl px-4 py-3 text-[#F4F3EF] font-mono text-xs focus:outline-none focus:border-[#D43838]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#9A978F] block mb-1">Deposit Amount (MUSD)</label>
                <input
                  type="number"
                  step="1"
                  value={streamDeposit}
                  onChange={(e) => setStreamDeposit(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-[#0A0A0C] border border-[#26252C] rounded-xl px-4 py-3 text-[#F4F3EF] font-mono text-sm focus:outline-none focus:border-[#D43838]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-[#9A978F]">Duration (Seconds)</label>
                  <div className="flex space-x-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setDuration('3600')}
                      className="px-2 py-0.5 rounded bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF] cursor-pointer"
                    >
                      1h
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('86400')}
                      className="px-2 py-0.5 rounded bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF] cursor-pointer"
                    >
                      1d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('2592000')}
                      className="px-2 py-0.5 rounded bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF] cursor-pointer"
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
                  className="w-full bg-[#0A0A0C] border border-[#26252C] rounded-xl px-4 py-3 text-[#F4F3EF] font-mono text-sm focus:outline-none focus:border-[#D43838]"
                />
              </div>

              {Number(streamDeposit) > 0 && Number(duration) > 0 && (
                <div className="text-[11px] font-mono text-[#9A978F] bg-[#0A0A0C] p-3 rounded-xl border border-[#26252C] flex justify-between">
                  <span>Streaming Flow Rate:</span>
                  <span className="text-[#34D399] font-bold">
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
                      ? 'bg-[#34D399]/10 border border-[#34D399]/40 text-[#34D399]'
                      : 'bg-[#D43838] text-white shadow-[0_0_15px_rgba(212,56,56,0.3)] animate-pulse'
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
                  className="flex-1 bg-[#D43838] hover:bg-[#E24A4A] text-white font-semibold py-3 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,56,56,0.25)]"
                >
                  {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'create_stream' ? 'Creating...' : '2. Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stream Management */}
        <div className="bg-[#121216] border border-[#26252C] p-7 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F3EF]">Stream Management</h3>
              <div className="flex items-center space-x-1.5">
                <label className="text-xs font-mono text-[#9A978F]">Stream ID:</label>
                <input
                  type="number"
                  min="0"
                  value={streamIdToManage}
                  onChange={(e) => setStreamIdToManage(e.target.value)}
                  className="w-16 bg-[#0A0A0C] border border-[#26252C] rounded-lg px-2 py-1 text-xs font-mono text-[#F4F3EF] focus:outline-none focus:border-[#D43838]"
                />
              </div>
            </div>

            {streamExists ? (
              <div className="space-y-4">
                <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Status:</span>
                    <span className={`font-bold ${streamIsActive ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                      {streamIsActive ? '● Streaming (Active)' : '○ Completed / Cancelled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Employer:</span>
                    <span className="text-[#F4F3EF]">{formatAddress(streamEmployer)} {isCurrentUserEmployer ? '(You)' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Recipient:</span>
                    <span className="text-[#F4F3EF]">{formatAddress(streamRecipient)} {isCurrentUserRecipient ? '(You)' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Total Deposited:</span>
                    <span className="font-bold text-[#F4F3EF]">{streamDepositAmount.toLocaleString()} MUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9A978F]">Claimable Now:</span>
                    <span className="font-bold text-[#34D399]">{claimableEth.toFixed(4)} MUSD</span>
                  </div>

                  {/* Flow Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-[#9A978F]">
                      <span>Vesting Flow</span>
                      <span className="text-[#34D399]">{streamProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-[#18181E] h-2.5 rounded-full overflow-hidden border border-[#26252C]">
                      <div
                        className="bg-gradient-to-r from-[#D43838] to-[#34D399] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                        style={{ width: `${streamProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Wave 2: Stream-to-Debt Amortization Split Configuration */}
                <div className="bg-[#0A0A0C] p-4 rounded-xl border border-[#26252C] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F3EF] flex items-center space-x-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#FF7A7A]" />
                      <span>Stream-to-Debt Amortization</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        isSplitEnabled && currentSplitBps > 0
                          ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30'
                          : 'bg-[#9A978F]/15 text-[#9A978F] border-[#26252C]'
                      }`}
                    >
                      {isSplitEnabled && currentSplitBps > 0
                        ? `${(currentSplitBps / 100).toFixed(0)}% Auto-Repay Active`
                        : 'Split Inactive'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#9A978F] leading-relaxed">
                    Recipients can automatically allocate up to 50% of claimed salary to amortize vault debt (theirs or their employer's), lowering liquidation risk on every paycheck.
                  </p>

                  {isCurrentUserRecipient && streamIsActive ? (
                    <form onSubmit={handleSetStreamSplit} className="space-y-3 pt-2 border-t border-[#26252C]">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <label className="text-[#9A978F]">Amortization Split %</label>
                          <div className="flex space-x-1">
                            {['0', '10', '20', '30', '50'].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setSplitPercent(p)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                  splitPercent === p ? 'bg-[#D43838] text-white shadow-xs' : 'bg-[#18181E] border border-[#26252C] text-[#F4F3EF]'
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
                          className="w-full accent-[#D43838] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <label className="text-[#9A978F]">Target Borrower Account</label>
                          {streamEmployer && (
                            <button
                              type="button"
                              onClick={() => setSplitTargetBorrower(streamEmployer)}
                              className="text-[#FF7A7A] hover:underline cursor-pointer"
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
                          className="w-full bg-[#121216] border border-[#26252C] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F4F3EF] focus:outline-none focus:border-[#D43838]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={(streamerPending && activeAction === 'set_stream_split') || !isReady}
                        className="w-full bg-[#D43838] hover:bg-[#E24A4A] text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(212,56,56,0.25)]"
                      >
                        {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'set_stream_split'
                          ? 'Configuring Split...'
                          : `Save ${splitPercent}% Debt Amortization Split`}
                      </button>
                    </form>
                  ) : (
                    <div className="text-[11px] text-[#9A978F]">
                      {isSplitEnabled && currentSplitBps > 0 ? (
                        <p>
                          Current Split: <strong className="text-[#34D399]">{(currentSplitBps / 100).toFixed(0)}%</strong> of claim will automatically repay debt for{' '}
                          <strong className="text-[#F4F3EF]">{formatAddress(currentSplitTarget)}</strong>.
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
                      className="w-full bg-[#34D399] hover:bg-[#2BB882] text-[#0A0A0C] font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                    >
                      {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'withdraw_stream'
                        ? 'Claiming...'
                        : isSplitEnabled && currentSplitBps > 0
                        ? `Claim Earned MUSD (${((claimableEth * (10000 - currentSplitBps)) / 10000).toFixed(4)} Wallet + ${((claimableEth * currentSplitBps) / 10000).toFixed(4)} Debt)`
                        : `Claim Earned MUSD (${claimableEth.toFixed(4)} Available)`}
                    </button>
                    {isSplitEnabled && currentSplitBps > 0 && claimableEth > 0 && (
                      <p className="text-[10px] text-center font-mono text-[#34D399]">
                        ✓ Closed-loop amortization: {((claimableEth * currentSplitBps) / 10000).toFixed(4)} MUSD amortizes debt for {formatAddress(currentSplitTarget)} on-chain.
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
                      className="flex-1 bg-[#0A0A0C] border border-[#26252C] rounded-xl px-3 py-2 text-xs font-mono text-[#F4F3EF] focus:outline-none focus:border-[#D43838]"
                    />
                    <button
                      type="submit"
                      disabled={(streamerPending && activeAction === 'top_up_stream') || !isReady || !topUpAmount || Number(topUpAmount) <= 0}
                      className="bg-[#18181E] hover:bg-[#22222B] border border-[#26252C] text-[#F4F3EF] font-semibold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="w-full bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {(streamerPending || txStatus === 'wallet_confirm') && activeAction === 'cancel_stream'
                      ? 'Revoking...'
                      : 'Cancel Stream (Earned to Recipient, Balance to Employer)'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-[#0A0A0C] p-8 rounded-xl border border-[#26252C] text-center space-y-2">
                <p className="text-xs font-mono text-[#9A978F]">Stream #{streamIdToManage} not yet initialized on Mezo L2.</p>
                <p className="text-[11px] text-[#9A978F]">Create a new stream on the left or enter an active Stream ID.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
