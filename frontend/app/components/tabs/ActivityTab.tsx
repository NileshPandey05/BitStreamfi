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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-[#DEDBD3] pb-4">
        <div>
          <h2 className="text-3xl font-serif-display font-bold text-[#171715]">On-Chain Activity Records</h2>
          <p className="text-xs text-[#77756F] mt-1">Confirmed transactions on Mezo Testnet with real explorer links.</p>
        </div>
        {transactions.length > 0 && (
          <button
            type="button"
            onClick={clearTransactionHistory}
            className="text-xs font-mono text-[#77756F] hover:text-[#C7473A] transition-colors cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] p-12 rounded-2xl text-center space-y-3 font-mono text-xs text-[#77756F]">
          <Activity className="w-8 h-8 text-[#DEDBD3] mx-auto" />
          <p>No transactions recorded in this browser session.</p>
          <p className="text-[11px]">Deposits, borrows, repayments, streams, and liquidations will appear here in real time.</p>
        </div>
      ) : (
        <div className="bg-[#FBFAF7] border border-[#DEDBD3] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F6F4EF] border-b border-[#DEDBD3] text-[#77756F]">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Amount / Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDBD3]">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-[#F6F4EF]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#171715]">{tx.type}</td>
                  <td className="py-3 px-4 text-[#77756F]">{tx.amount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'success'
                          ? 'bg-[#258454]/15 text-[#258454]'
                          : tx.status === 'failed'
                          ? 'bg-[#C7473A]/15 text-[#C7473A]'
                          : 'bg-[#E66C35]/15 text-[#E66C35]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#77756F]">{tx.timestamp}</td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`https://explorer.test.mezo.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E66C35] hover:underline inline-flex items-center space-x-1"
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
