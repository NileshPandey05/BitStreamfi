import React from 'react';
import { AlertTriangle, Droplets, ChevronDown, Wallet } from 'lucide-react';
import { MEZO_TESTNET_CHAIN_ID } from '../contracts';
import { getWalletIcon } from './WalletModal';
import { ActiveAction } from '../types';

interface HeaderProps {
  mounted: boolean;
  isConnected: boolean;
  address?: string;
  connector?: any;
  chainId?: number;
  btcPriceUSD: number;
  activeAction: ActiveAction;
  genericPending: boolean;
  isReady: boolean;
  handleOpenConnectWallet: () => void;
  handleOpenManageWallet: () => void;
  handleClaimFaucet: () => void;
  switchChain: (args: { chainId: number }) => void;
  formatAddress: (addr?: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  mounted,
  isConnected,
  address,
  connector,
  chainId,
  btcPriceUSD,
  activeAction,
  genericPending,
  isReady,
  handleOpenConnectWallet,
  handleOpenManageWallet,
  handleClaimFaucet,
  switchChain,
  formatAddress,
}) => {
  return (
    <>
      {/* Wrong Network Warning Bar */}
      {mounted && isConnected && chainId !== MEZO_TESTNET_CHAIN_ID && (
        <div className="bg-[#C7473A] text-white px-6 py-2.5 text-xs font-mono flex items-center justify-between z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Wrong network connected. BitStreamfi operates on Mezo Testnet (Chain ID 31611).</span>
          </div>
          <button
            type="button"
            onClick={() => switchChain({ chainId: MEZO_TESTNET_CHAIN_ID })}
            className="bg-white text-[#C7473A] font-bold px-3 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Switch to Mezo Testnet
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-[#DEDBD3] bg-[#FBFAF7]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-[#171715] text-[#F6F4EF] w-10 h-10 rounded-xl flex items-center justify-center font-serif-display font-bold text-xl shadow-md">
              ₿
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif-display text-2xl font-bold tracking-tight text-[#171715]">BitStreamfi</h1>
                <span className="text-[10px] font-mono bg-[#E66C35]/15 text-[#E66C35] px-2 py-0.5 rounded-full font-bold">
                  Wave 2 Composable
                </span>
              </div>
              <p className="text-xs font-mono text-[#77756F]">Bitcoin Collateral • Mezo Troves • MUSD Streaming</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Oracle Price Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#F6F4EF] border border-[#DEDBD3] px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#258454] animate-pulse" />
              <span className="text-[#77756F]">Mezo Oracle:</span>
              <strong className="text-[#171715]">${btcPriceUSD.toLocaleString()}</strong>
            </div>

            {/* Test tBTC Faucet Button */}
            <button
              type="button"
              onClick={handleClaimFaucet}
              disabled={(genericPending && activeAction === 'faucet_tbtc') || !isReady}
              className="hidden md:flex items-center space-x-1.5 bg-[#E66C35]/10 hover:bg-[#E66C35]/20 text-[#E66C35] border border-[#E66C35]/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              title="Claim 1,000 Test tBTC ERC-20 tokens directly to your wallet"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{activeAction === 'faucet_tbtc' ? 'Claiming...' : 'tBTC Faucet'}</span>
            </button>

            {/* Wallet Connect & Account Management */}
            {mounted && isConnected ? (
              <button
                type="button"
                onClick={handleOpenManageWallet}
                className="flex items-center space-x-2.5 bg-[#F6F4EF] hover:bg-[#EFECE6] border border-[#DEDBD3] hover:border-[#171715] px-3.5 py-2 rounded-xl transition-all shadow-xs group cursor-pointer"
                title="Manage wallet, view account details, switch wallet, or disconnect"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getWalletIcon(connector?.name || connector?.id, undefined, 'w-4 h-4')}
                </div>
                <div className="hidden sm:flex flex-col text-left font-mono text-xs">
                  <div className="flex items-center space-x-1.5 leading-tight">
                    <span className="text-[#171715] font-bold group-hover:text-[#E66C35] transition-colors">
                      {formatAddress(address)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#258454] animate-pulse" />
                  </div>
                  <span className="text-[10px] text-[#77756F] leading-tight">
                    {connector?.name || 'Mezo Testnet'}
                  </span>
                </div>
                <span className="sm:hidden font-mono text-xs font-bold text-[#171715]">
                  {formatAddress(address)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#77756F] group-hover:text-[#171715] group-hover:translate-y-0.5 transition-all ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenConnectWallet}
                className="bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
