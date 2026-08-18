
import React, { useState } from 'react';
import SparklesIcon from './components/icons/SparklesIcon';
import { PresetProvider } from './contexts/PresetContext';
import ExtractionTab from './components/tabs/ExtractionTab';
import ScoutTab from './components/tabs/ScoutTab';
import DriveConnectButton from './components/DriveConnectButton';

type ActiveTab = 'extract' | 'scout';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('extract');

    const tabButtonClass = (tab: ActiveTab) =>
        `px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
            activeTab === tab
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`;

    return (
        <PresetProvider>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                <header className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 gap-4">
                            <div className="flex items-center space-x-3 shrink-0">
                                <SparklesIcon className="w-7 h-7 text-cyan-500" />
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">JD Scout Handler</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <nav className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-xl">
                                    <button className={tabButtonClass('extract')} onClick={() => setActiveTab('extract')}>
                                        求人情報抽出
                                    </button>
                                    <button className={tabButtonClass('scout')} onClick={() => setActiveTab('scout')}>
                                        スカウト生成
                                    </button>
                                </nav>
                                <DriveConnectButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <div style={{ display: activeTab === 'extract' ? 'block' : 'none' }}>
                        <ExtractionTab />
                    </div>
                    <div style={{ display: activeTab === 'scout' ? 'block' : 'none' }}>
                        <ScoutTab />
                    </div>
                </main>
            </div>
        </PresetProvider>
    );
};

export default App;
