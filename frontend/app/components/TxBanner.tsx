import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import { TxStatus } from '../types';

interface TxBannerProps {
  txStatus: TxStatus;
  statusMessage: string;
  onClose: () => void;
}

export const TxBanner: React.FC<TxBannerProps> = ({
  txStatus,
  statusMessage,
  onClose,
}) => {
  if (txStatus === 'idle') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#121216]/95 border border-[#26252C] p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] max-w-sm sm:max-w-md w-full flex flex-col space-y-2 animate-fadeIn backdrop-blur-md">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {txStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />}
          {txStatus === 'failed' && <XCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />}
          {(txStatus === 'pending' || txStatus === 'wallet_confirm' || txStatus === 'preparing') && (
            <RefreshCw className="w-5 h-5 text-[#D43838] shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#9A978F]">
              {txStatus === 'success'
                ? 'Confirmed on Mezo L2'
                : txStatus === 'failed'
                ? 'Transaction Failed'
                : txStatus === 'wallet_confirm'
                ? 'Awaiting Wallet Signature'
                : 'Broadcasting to Mezo'}
            </p>
            <p className="text-xs text-[#F4F3EF] font-mono mt-1 break-words">{statusMessage}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-[#9A978F] hover:text-[#F4F3EF] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
