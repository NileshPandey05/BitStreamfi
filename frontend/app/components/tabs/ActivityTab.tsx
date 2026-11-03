import React from 'react';
import { Activity, ExternalLink } from 'lucide-react';
import { TransactionRecord } from '../../types';

interface ActivityTabProps {
  transactions: TransactionRecord[];
  clearTransactionHistory: () => void;
  formatAddress: (addr?: string) => string;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  transactions,
  clearTransactionHistory,
  formatAddress,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-[#F4F3EF]">
      <div className="flex justify-between items-center border-b border-[#26252C] pb-4">
        <div>
          <h2 className="text-3xl font-serif-display font-bold text-[#F4F3EF] flex items-center space-x-2">
            <span>On-Chain Activity Ledger</span>
            <span className="text-xs font-serif text-[#C5A059] italic font-normal tracking-normal">取引台帳</span>
          </h2>
          <p className="text-xs text-[#9A978F] mt-1 font-mono">Confirmed transactions on Mezo Testnet with real explorer links.</p>
        </div>
        {transactions.length > 0 && (
          <button
            type="button"
            onClick={clearTransactionHistory}
            className="text-xs font-mono text-[#9A978F] hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-[#121216] border border-[#26252C] p-12 rounded-2xl text-center space-y-3 font-mono text-xs text-[#9A978F]">
          <Activity className="w-8 h-8 text-[#26252C] mx-auto" />
          <p className="text-[#F4F3EF]">No transactions recorded in this browser session.</p>
          <p className="text-[11px] text-[#9A978F]">Deposits, borrows, repayments, streams, and liquidations will appear here in real time.</p>
        </div>
      ) : (
        <div className="bg-[#121216] border border-[#26252C] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0A0C] border-b border-[#26252C] text-[#9A978F]">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Amount / Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26252C]">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-[#18181E] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#F4F3EF]">{tx.type}</td>
                  <td className="py-3.5 px-4 text-[#9A978F]">{tx.amount}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        tx.status === 'success'
                          ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30'
                          : tx.status === 'failed'
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                          : 'bg-[#D43838]/15 text-[#FF7A7A] border-[#D43838]/30'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#9A978F]">{tx.timestamp}</td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF7A7A] hover:underline inline-flex items-center space-x-1"
                    >
                      <span>{formatAddress(tx.hash)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
