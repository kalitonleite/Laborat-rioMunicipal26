
import React from 'react';

export interface TabItem {
    id: string;
    label: string;
    icon: string;
}

interface DashboardTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    variant?: 'blue' | 'emerald';
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    variant = 'blue'
}) => {
    const activeClass = variant === 'blue' ? 'bg-[#1e40af] text-white shadow-md' : 'bg-emerald-600 text-white shadow-md';

    return (
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
            <div className="flex min-w-max md:min-w-0 md:w-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-1 px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? activeClass : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <i className={`fas ${tab.icon}`}></i> <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DashboardTabs;
