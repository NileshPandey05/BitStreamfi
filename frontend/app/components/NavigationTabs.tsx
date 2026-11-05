import React from 'react';
import { TabType } from '../types';
import { LayoutDashboard, Vault, Send, Award, Sliders, History } from 'lucide-react';

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
  const tabs: { id: TabType; num: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', num: '1', label: 'Overview', icon: LayoutDashboard },
    { id: 'vault', num: '2', label: 'Vault & Credit', icon: Vault },
    { id: 'payroll', num: '3', label: 'MUSD Payroll', icon: Send },
    { id: 'staking', num: '4', label: 'MEZO Staking', icon: Award },
    { id: 'simulator', num: '5', label: 'Risk & Arena', icon: Sliders },
    { id: 'activity', num: '6', label: 'Activity', icon: History },
  ];

  return (
    <nav className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2DFD7]/80">
      {/* Segmented Tab Pill Group */}
      <div className="flex items-center space-x-1.5 bg-[#EFECE5]/80 p-1.5 rounded-2xl border border-[#E2DFD7] overflow-x-auto no-scrollbar max-w-full shadow-[inset_0_1px_2px_rgba(25,24,22,0.03)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-[#191816] text-[#F7F5F0] shadow-[0_2px_8px_-2px_rgba(25,24,22,0.25)] font-semibold'
                  : 'text-[#6B6760] hover:text-[#191816] hover:bg-white/70'
              }`}
            >
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#E2DFD7]/60 text-[#8C877D]'
                }`}
              >
                {tab.num}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trove Composed Status Pill */}
      <div className="flex items-center space-x-2 text-xs font-mono bg-white/90 border border-[#E2DFD7] px-3.5 py-2 rounded-xl shrink-0 self-start lg:self-center shadow-[0_1px_2px_rgba(25,24,22,0.03)]">
        <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-pulse" />
        <span className="text-[#1F7A4D] font-bold">Trove ICR: {troveIcrNum.toFixed(1)}%</span>
        <span className="text-[#8C877D] hidden sm:inline">|</span>
        <span className="text-[#6B6760] hidden sm:inline">Mezo BorrowerOperations</span>
      </div>
    </nav>
  );
};
