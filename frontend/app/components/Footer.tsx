import React from 'react';
import { CONTRACT_ADDRESSES } from '../contracts';
import { HankoStamp } from './ui/HankoStamp';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#26252C] bg-[#0A0A0C] py-10 text-xs font-mono text-[#9A978F]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-3">
          <HankoStamp size="sm" primaryKanji="水流" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#F4F3EF]">BitStreamfi</span>
              <span className="text-[#C5A059] text-[10px] italic font-serif">堂島金融の精神</span>
            </div>
            <p className="text-[11px] text-[#7A7870]">Built for Akindo Wave 2 Hackathon on Mezo Network.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-[11px]">
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.vault}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            Vault Contract ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.streamer}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            Streamer ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.creditEngine}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            Credit Engine ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.stakingBoost}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            MEZO Staking Boost ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.musd}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            Official MUSD ↗
          </a>
          <a
            href={`https://explorer.test.mezo.org/address/${CONTRACT_ADDRESSES.tbtc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF7A7A] transition-colors"
          >
            Test tBTC ↗
          </a>
        </div>
      </div>
    </footer>
  );
};
