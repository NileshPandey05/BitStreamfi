import React from 'react';
import { AlertTriangle, Droplets, ChevronDown, Wallet } from 'lucide-react';
import { MEZO_TESTNET_CHAIN_ID } from '../contracts';
import { getWalletIcon } from './WalletModal';
import { ActiveAction } from '../types';
import { HankoStamp } from './ui/HankoStamp';

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
        <div className="bg-[#A62626] text-white px-6 py-2.5 text-xs font-mono flex items-center justify-between z-50 border-b border-[#D43838]/40">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#FFBABA]" />
            <span>Wrong network connected. BitStreamfi operates on Mezo Testnet (Chain ID 31611).</span>
          </div>
          <button
            type="button"
            onClick={() => switchChain({ chainId: MEZO_TESTNET_CHAIN_ID })}
            className="bg-white text-[#A62626] font-bold px-3 py-1 rounded hover:bg-[#FFF0F0] transition-colors cursor-pointer text-xs"
          >
            Switch to Mezo Testnet
          </button>
        </div>
      )}

      {/* Main Header - Sumi-e Dark Obsidian Aesthetic */}
      <header className="border-b border-[#26252C] bg-[#0A0A0C]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo & Hanko Seal */}
          <div className="flex items-center space-x-3.5">
            <HankoStamp size="md" primaryKanji="水流" subKanji="自律" />
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-serif-display text-2xl font-bold tracking-tight text-[#F4F3EF] flex items-baseline space-x-1.5">
                  <span>BitStreamfi</span>
                  <span className="text-xs font-serif text-[#C5A059] opacity-80 italic font-normal tracking-normal">ビット流</span>
                </h1>
                <span className="text-[10px] font-mono bg-[#D43838]/15 text-[#FF6B6B] border border-[#D43838]/30 px-2 py-0.5 rounded-full font-bold">
                  Wave 2 Composable
                </span>
              </div>
              <p className="text-xs font-mono text-[#9A978F]">Bitcoin Collateral • Mezo Troves • Continuous Settlement</p>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center space-x-3">
            {/* Live Oracle Price Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#121216] border border-[#26252C] px-3.5 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-[#9A978F]">Oracle:</span>
              <strong className="text-[#F4F3EF]">${btcPriceUSD.toLocaleString()}</strong>
            </div>

            {/* Test tBTC Faucet Button */}
            <button
              type="button"
              onClick={handleClaimFaucet}
              disabled={(genericPending && activeAction === 'faucet_tbtc') || !isReady}
              className="hidden md:flex items-center space-x-1.5 bg-[#D43838]/10 hover:bg-[#D43838]/20 text-[#FF7A7A] border border-[#D43838]/30 text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(212,56,56,0.15)]"
              title="Claim 1,000 Test tBTC ERC-20 tokens directly to your wallet"
            >
              <Droplets className="w-3.5 h-3.5 text-[#FF7A7A]" />
              <span>{activeAction === 'faucet_tbtc' ? 'Claiming...' : 'tBTC Faucet'}</span>
            </button>

            {/* Wallet Connect & Account Management */}
            {mounted && isConnected ? (
              <button
                type="button"
                onClick={handleOpenManageWallet}
                className="flex items-center space-x-2.5 bg-[#121216] hover:bg-[#18181E] border border-[#26252C] hover:border-[#D43838]/60 px-3.5 py-2 rounded-xl transition-all shadow-sm group cursor-pointer"
                title="Manage wallet, view account details, switch wallet, or disconnect"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#C5A059]">
                  {getWalletIcon(connector?.name || connector?.id, undefined, 'w-4 h-4')}
                </div>
                <div className="hidden sm:flex flex-col text-left font-mono text-xs">
                  <div className="flex items-center space-x-1.5 leading-tight">
                    <span className="text-[#F4F3EF] font-bold group-hover:text-[#FF7A7A] transition-colors">
                      {formatAddress(address)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                  </div>
                  <span className="text-[10px] text-[#9A978F] leading-tight">
                    {connector?.name || 'Mezo Testnet'}
                  </span>
                </div>
                <span className="sm:hidden font-mono text-xs font-bold text-[#F4F3EF]">
                  {formatAddress(address)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9A978F] group-hover:text-[#F4F3EF] group-hover:translate-y-0.5 transition-all ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenConnectWallet}
                className="bg-[#D43838] hover:bg-[#E24A4A] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(212,56,56,0.3)] flex items-center space-x-2 cursor-pointer border border-[#FF6B6B]/30"
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
