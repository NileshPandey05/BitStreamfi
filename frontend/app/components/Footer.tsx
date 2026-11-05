import React from 'react';
import { CONTRACT_ADDRESSES } from '../contracts';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E2DFD7] bg-[#F7F5F0] py-8 text-xs font-mono text-[#8C877D]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-bold text-[#191816]">BitStreamfi</span> — Built for Akindo Hackathon Wave 2 on Mezo Network.
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.vault}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            Vault Contract ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.streamer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            Streamer ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.creditEngine}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            Credit Engine ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.stakingBoost}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            MEZO Staking Boost ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.musd}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            Official MUSD ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.tbtc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#171715]"
          >
            Test tBTC ↗
          </a>
          <a
            href="https://t.me/BitStreamfiBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191816] text-white hover:bg-[#C85A27] rounded-md transition-colors font-medium text-[11px]"
          >
            <span>🤖</span>
            <span>Telegram Bot (@BitStreamfiBot) ↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
