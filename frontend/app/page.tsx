'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, VAULT_ABI, STREAMER_ABI, CREDIT_ENGINE_ABI } from './contracts';
import { parseEther, formatEther } from 'viem';
import { Shield, Zap, DollarSign, Clock, Wallet, ArrowUpRight, PlusCircle, XCircle } from 'lucide-react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [activeTab, setActiveTab] = useState<'vault' | 'payroll'>('vault');

  // Vault form states
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  // Payroll form states
  const [recipient, setRecipient] = useState('');
  const [streamDeposit, setStreamDeposit] = useState('');
  const [duration, setDuration] = useState('');
  const [streamIdToManage, setStreamIdToManage] = useState('0');
  const [topUpAmount, setTopUpAmount] = useState('');

  // Wagmi write hooks
  const { writeContract: writeVault, isPending: vaultPending } = useWriteContract();
  const { writeContract: writeStreamer, isPending: streamerPending } = useWriteContract();

  // Read Vault Data
  const { data: userCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'collateralBalances',
    args: address ? [address] : undefined,
  });

  const { data: userDebt } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'debtBalances',
    args: address ? [address] : undefined,
  });

  const { data: currentLTV } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: VAULT_ABI,
    functionName: 'getCurrentLTV',
    args: address ? [address] : undefined,
  });

  // Read Stream Data
  const { data: streamData } = useReadContract({
    address: CONTRACT_ADDRESSES.streamer,
    abi: STREAMER_ABI,
    functionName: 'streams',
    args: [BigInt(streamIdToManage || '0')],
  });

  // Vault Actions
  const handleDepositCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collateralAmount) return;
    writeVault({
      address: CONTRACT_ADDRESSES.vault,
      abi: VAULT_ABI,
      functionName: 'depositCollateral',
      args: [parseEther(collateralAmount)],
    });
  };

  const handleBorrowMUSD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowAmount) return;
    writeVault({
      address: CONTRACT_ADDRESSES.vault,
      abi: VAULT_ABI,
      functionName: 'borrowMUSD',
      args: [parseEther(borrowAmount)],
    });
  };

  const handleRepayMUSD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmount) return;
    writeVault({
      address: CONTRACT_ADDRESSES.vault,
      abi: VAULT_ABI,
      functionName: 'repayMUSD',
      args: [parseEther(repayAmount)],
    });
  };

  // Payroll Actions
  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !streamDeposit || !duration) return;
    writeStreamer({
      address: CONTRACT_ADDRESSES.streamer,
      abi: STREAMER_ABI,
      functionName: 'createStream',
      args: [recipient as `0x${string}`, parseEther(streamDeposit), BigInt(duration)],
    });
  };

  const handleWithdrawStream = () => {
    writeStreamer({
      address: CONTRACT_ADDRESSES.streamer,
      abi: STREAMER_ABI,
      functionName: 'withdrawFromStream',
      args: [BigInt(streamIdToManage)],
    });
  };

  const handleTopUpStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount) return;
    writeStreamer({
      address: CONTRACT_ADDRESSES.streamer,
      abi: STREAMER_ABI,
      functionName: 'topUpStream',
      args: [BigInt(streamIdToManage), parseEther(topUpAmount)],
    });
  };

  const handleCancelStream = () => {
    writeStreamer({
      address: CONTRACT_ADDRESSES.streamer,
      abi: STREAMER_ABI,
      functionName: 'cancelStream',
      args: [BigInt(streamIdToManage)],
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 p-2 rounded-xl text-slate-950 font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
              BITSTREAMFI
            </h1>
            <p className="text-xs text-slate-400">Bitcoin-Backed Payroll & Settlement • Mezo L2</p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm font-mono text-slate-300">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold ml-2"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'vault'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>MezoFlow Vault & Credit Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'payroll'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Payroll Streamer</span>
          </button>
        </div>

        {/* Tab 1: Vault & Credit Engine */}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">Collateral Balance (tBTC)</p>
                <p className="text-3xl font-black mt-2 text-orange-400 font-mono">
                  {userCollateral ? formatEther(userCollateral as bigint) : '0.0'} tBTC
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">Borrowed Debt (MUSD)</p>
                <p className="text-3xl font-black mt-2 text-amber-300 font-mono">
                  {userDebt ? formatEther(userDebt as bigint) : '0.0'} MUSD
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">Current LTV (Max 60%)</p>
                <p className="text-3xl font-black mt-2 text-emerald-400 font-mono">
                  {currentLTV ? `${Number(currentLTV) / 100}%` : '0.0%'}
                </p>
              </div>
            </div>

            {/* Deposit Collateral Card */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5 text-orange-400" />
                  <span>Deposit Collateral</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6">Deposit tBTC collateral into the MezoFlow Vault.</p>
                <form onSubmit={handleDepositCollateral} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Amount (tBTC)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={vaultPending || !isConnected}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all"
                  >
                    {vaultPending ? 'Processing...' : 'Deposit tBTC'}
                  </button>
                </form>
              </div>
            </div>

            {/* Borrow MUSD Card */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>Borrow MUSD</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6">Mint MUSD against your tBTC collateral (up to 60% LTV).</p>
                <form onSubmit={handleBorrowMUSD} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Amount (MUSD)</label>
                    <input
                      type="number"
                      step="1"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={vaultPending || !isConnected}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all"
                  >
                    {vaultPending ? 'Processing...' : 'Borrow MUSD'}
                  </button>
                </form>
              </div>
            </div>

            {/* Repay MUSD Card */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  <span>Repay MUSD</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6">Repay borrowed MUSD to reduce debt and lower LTV.</p>
                <form onSubmit={handleRepayMUSD} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Amount (MUSD)</label>
                    <input
                      type="number"
                      step="1"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={vaultPending || !isConnected}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all"
                  >
                    {vaultPending ? 'Processing...' : 'Repay MUSD'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payroll Streaming */}
        {activeTab === 'payroll' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Stream */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span>Create Salary Stream</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">Stream MUSD second-by-second to employees or contractors.</p>
              <form onSubmit={handleCreateStream} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Recipient Address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Deposit Amount (MUSD)</label>
                  <input
                    type="number"
                    step="1"
                    value={streamDeposit}
                    onChange={(e) => setStreamDeposit(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2592000 (30 days)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={streamerPending || !isConnected}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all"
                >
                  {streamerPending ? 'Processing...' : 'Create Stream'}
                </button>
              </form>
            </div>

            {/* Manage Stream */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Stream Management</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6">View, withdraw, top-up, or cancel active payroll streams.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Stream ID</label>
                    <input
                      type="number"
                      value={streamIdToManage}
                      onChange={(e) => setStreamIdToManage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {streamData && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
                      <p><span className="text-slate-400">Employer:</span> {(streamData as any)[0]?.slice(0, 6)}...</p>
                      <p><span className="text-slate-400">Recipient:</span> {(streamData as any)[1]?.slice(0, 6)}...</p>
                      <p><span className="text-slate-400">Deposit:</span> {formatEther((streamData as any)[2] || BigInt(0))} MUSD</p>
                      <p><span className="text-slate-400">Withdrawn:</span> {formatEther((streamData as any)[3] || BigInt(0))} MUSD</p>
                    </div>
                  )}

                  <form onSubmit={handleTopUpStream} className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Top up amount"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        disabled={streamerPending || !isConnected}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
                      >
                        Top Up
                      </button>
                    </div>
                  </form>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleWithdrawStream}
                      disabled={streamerPending || !isConnected}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={handleCancelStream}
                      disabled={streamerPending || !isConnected}
                      className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
