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
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: '1. Overview' },
    { id: 'vault', label: '2. Vault & Credit' },
    { id: 'payroll', label: '3. MUSD Payroll' },
    { id: 'staking', label: '4. MEZO Staking' },
    { id: 'simulator', label: '5. Risk & Keeper Arena' },
    { id: 'activity', label: '6. Activity' },
  ];

  return (
    <nav className="flex justify-between items-center border-b border-[#DEDBD3] pb-4">
      <div className="flex space-x-2 bg-[#FBFAF7] p-1.5 rounded-2xl border border-[#DEDBD3] overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#171715] text-white shadow-sm'
                : 'text-[#77756F] hover:text-[#171715] hover:bg-[#F6F4EF]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trove Composed Badge */}
      <div className="hidden lg:flex items-center space-x-2 text-xs font-mono bg-[#FBFAF7] border border-[#DEDBD3] px-3.5 py-2 rounded-xl shrink-0">
        <span className="text-[#258454] font-bold">● Trove ICR: {troveIcrNum.toFixed(1)}%</span>
        <span className="text-[#77756F]">| Composed with BorrowerOperations</span>
      </div>
    </nav>
  );
};
