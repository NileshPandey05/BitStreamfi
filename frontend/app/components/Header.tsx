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
      <header className="border-b border-[#E2DFD7] bg-[#F7F5F0]/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3.5 select-none">
            <div className="bg-[#191816] text-[#F7F5F0] w-10 h-10 rounded-2xl flex items-center justify-center font-serif-display font-bold text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_-2px_rgba(25,24,22,0.25)] transition-transform hover:scale-105">
              ₿
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-serif-display text-2xl font-bold tracking-tight text-[#191816]">BitStreamfi</h1>
                <span className="text-[10px] font-mono bg-[#C85A27]/10 text-[#C85A27] border border-[#C85A27]/20 px-2.5 py-0.5 rounded-full font-semibold shadow-[0_1px_2px_rgba(200,90,39,0.05)]">
                  Wave 2 Composable
                </span>
              </div>
              <p className="text-xs font-mono text-[#8C877D] tracking-tight">
                Bitcoin Collateral · Mezo Troves · MUSD Streaming
              </p>
            </div>
          </div>

          {/* Right Action Bar - Uniform Bento Grid Style */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Bento Box 1: Live Oracle Price */}
            <div className="hidden sm:flex items-center space-x-2.5 h-11 px-3.5 bg-white border border-[#E2DFD7] rounded-xl shadow-[0_1px_2px_rgba(25,24,22,0.03)] font-mono">
              <div className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-[#8C877D] font-medium">Mezo Oracle</span>
                <span className="text-xs font-bold text-[#191816] whitespace-nowrap">
                  ${btcPriceUSD.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Bento Box 2: Test tBTC Faucet Button */}
            <button
              type="button"
              onClick={handleClaimFaucet}
              disabled={(genericPending && activeAction === 'faucet_tbtc') || !isReady}
              className="hidden md:flex items-center space-x-2.5 h-11 px-3.5 bg-white hover:bg-[#FBF0E9] border border-[#E2DFD7] hover:border-[#C85A27]/40 rounded-xl transition-all shadow-[0_1px_2px_rgba(25,24,22,0.03)] cursor-pointer disabled:opacity-50 group active:scale-98"
              title="Claim 1,000 Test tBTC ERC-20 tokens directly to your wallet"
            >
              <div className="w-6 h-6 rounded-lg bg-[#C85A27]/10 flex items-center justify-center shrink-0 group-hover:bg-[#C85A27]/20 transition-colors">
                <Droplets className="w-3.5 h-3.5 text-[#C85A27]" />
              </div>
              <div className="flex flex-col text-left font-mono leading-tight whitespace-nowrap">
                <span className="text-[9px] uppercase tracking-wider text-[#8C877D] font-medium">Testnet Faucet</span>
                <span className="text-xs font-bold text-[#C85A27]">
                  {activeAction === 'faucet_tbtc' ? 'Claiming...' : 'Claim 1k tBTC'}
                </span>
              </div>
            </button>

            {/* Bento Box 3: Wallet Connect & Account Management */}
            {mounted && isConnected ? (
              <button
                type="button"
                onClick={handleOpenManageWallet}
                className="flex items-center space-x-2.5 h-11 px-3.5 bg-white hover:bg-[#FAF8F5] border border-[#E2DFD7] hover:border-[#191816]/30 rounded-xl transition-all shadow-[0_1px_2px_rgba(25,24,22,0.03)] group cursor-pointer active:scale-98"
                title="Manage wallet, view account details, switch wallet, or disconnect"
              >
                <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E2DFD7]/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getWalletIcon(connector?.name || connector?.id, undefined, 'w-3.5 h-3.5')}
                </div>
                <div className="flex flex-col text-left font-mono leading-tight whitespace-nowrap">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-[#191816] group-hover:text-[#C85A27] transition-colors">
                      {formatAddress(address)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A4D] animate-pulse" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8C877D] font-medium">
                    {connector?.name || 'Mezo Testnet'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#191816] group-hover:translate-y-0.5 transition-all ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenConnectWallet}
                className="flex items-center space-x-2.5 h-11 px-4 bg-[#191816] hover:bg-[#C85A27] text-white rounded-xl transition-all shadow-[0_2px_8px_-2px_rgba(25,24,22,0.25)] cursor-pointer active:scale-98 font-semibold text-xs whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 text-white" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
