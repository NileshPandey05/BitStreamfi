import React from 'react';
import { Wallet } from 'lucide-react';

interface ConnectPromptProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onConnect: () => void;
}

export const ConnectPrompt: React.FC<ConnectPromptProps> = ({
  title,
  description,
  icon,
  onConnect,
}) => {
  return (
    <div className="bg-[#121216] border border-[#D43838]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(212,56,56,0.1)]">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#D43838]/15 text-[#FF7A7A] border border-[#D43838]/30 flex items-center justify-center shrink-0">
          {icon || <Wallet className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-serif-display text-lg font-bold text-[#F4F3EF]">{title}</h4>
          <p className="text-xs text-[#9A978F]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#D43838] hover:bg-[#E24A4A] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(212,56,56,0.25)] border border-[#FF6B6B]/30"
      >
        <Wallet className="w-4 h-4" />
        <span>Select & Connect Wallet</span>
      </button>
    </div>
  );
};
