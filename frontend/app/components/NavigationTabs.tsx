import React from 'react';
import { TabType } from '../types';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  troveIcrNum: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  troveIcrNum,
}) => {
  const tabs: { id: TabType; label: string; kanji: string }[] = [
    { id: 'overview', label: 'Overview', kanji: '概要' },
    { id: 'vault', label: 'Vault & Credit', kanji: '金庫' },
    { id: 'payroll', label: 'MUSD Payroll', kanji: '給与' },
    { id: 'staking', label: 'MEZO Staking', kanji: '利回り' },
    { id: 'simulator', label: 'Keeper Arena', kanji: '闘技場' },
    { id: 'activity', label: 'Ledger', kanji: '台帳' },
  ];

  return (
    <nav className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#26252C] pb-4">
      {/* Tab Switcher Pills */}
      <div className="flex space-x-1.5 bg-[#121216] p-1.5 rounded-2xl border border-[#26252C] overflow-x-auto max-w-full">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-[#D43838] text-white shadow-[0_0_15px_rgba(212,56,56,0.35)]'
                : 'text-[#9A978F] hover:text-[#F4F3EF] hover:bg-[#18181E]'
            }`}
          >
            <span className="text-[10px] opacity-75 font-mono">{idx + 1}.</span>
            <span>{tab.label}</span>
            <span className={`text-[9px] font-serif transition-opacity ${activeTab === tab.id ? 'opacity-90 text-[#FFE0E0]' : 'opacity-40'}`}>
              {tab.kanji}
            </span>
          </button>
        ))}
      </div>

      {/* Trove Composed Live Badge */}
      <div className="flex items-center space-x-2.5 text-xs font-mono bg-[#121216] border border-[#26252C] px-4 py-2 rounded-xl shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
        <span className="text-[#34D399] font-bold">Trove ICR: {troveIcrNum.toFixed(1)}%</span>
        <span className="text-[#9A978F]">|</span>
        <span className="text-[#9A978F] text-[11px]">BorrowerOperations Composed</span>
      </div>
    </nav>
  );
};
