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
    <div className="bg-[#FBFAF7] border border-[#E66C35]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#E66C35]/10 text-[#E66C35] flex items-center justify-center shrink-0">
          {icon || <Wallet className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-serif-display text-lg font-bold text-[#171715]">{title}</h4>
          <p className="text-xs text-[#77756F]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#171715] hover:bg-[#E66C35] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center space-x-2 cursor-pointer"
      >
        <Wallet className="w-4 h-4" />
        <span>Select & Connect Wallet</span>
      </button>
    </div>
  );
};
