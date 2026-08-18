
import React, { useState } from 'react';
import TrashIcon from './icons/TrashIcon';

interface TeamSyncPanelProps {
    researcherRoster: string[];
    onAddResearcher: (email: string) => void;
    onRemoveResearcher: (email: string) => void;
    onOverwriteResearcher: (email: string) => void;
    sharedWithAgentEmail: string | null;
    onShareWithAgent: (email: string) => void;
    isBusy: boolean;
}

const TeamSyncPanel: React.FC<TeamSyncPanelProps> = ({
    researcherRoster,
    onAddResearcher,
    onRemoveResearcher,
    onOverwriteResearcher,
    sharedWithAgentEmail,
    onShareWithAgent,
    isBusy,
}) => {
    const [newResearcherEmail, setNewResearcherEmail] = useState('');
    const [newAgentEmail, setNewAgentEmail] = useState('');

    const inputStyle = "flex-grow p-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:outline-none";
    const buttonStyle = "shrink-0 px-3 py-2 text-xs font-bold rounded-md text-cyan-600 dark:text-cyan-400 border border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 disabled:opacity-50 disabled:cursor-not-allowed";

    const handleAdd = () => {
        const email = newResearcherEmail.trim().toLowerCase();
        if (!email) return;
        onAddResearcher(email);
        setNewResearcherEmail('');
    };

    const handleShare = () => {
        const email = newAgentEmail.trim().toLowerCase();
        if (!email) return;
        onShareWithAgent(email);
    };

    return (
        <div className="space-y-5 text-sm">
            <div className="space-y-2">
                <h4 className="font-bold text-slate-600 dark:text-slate-300">担当リサーチャーに配布する</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    リサーチャー側で「担当エージェントと共有する」が実行済みなら、「上書き」で今のあなたの媒体プリセットをそのまま反映できます。
                </p>
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={newResearcherEmail}
                        onChange={e => setNewResearcherEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                        placeholder="researcher@bloom-firm.com"
                        className={inputStyle}
                    />
                    <button type="button" onClick={handleAdd} disabled={isBusy || !newResearcherEmail.trim()} className={buttonStyle}>追加</button>
                </div>
                {researcherRoster.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">担当リサーチャーはまだ登録されていません。</p>
                ) : (
                    <div className="space-y-1.5">
                        {researcherRoster.map(email => (
                            <div key={email} className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                                <span className="text-xs text-slate-700 dark:text-slate-300 break-all">{email}</span>
                                <div className="flex gap-1 shrink-0">
                                    <button type="button" onClick={() => onOverwriteResearcher(email)} disabled={isBusy} className={buttonStyle}>上書き</button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveResearcher(email)}
                                        disabled={isBusy}
                                        title="担当から外す（Drive側の共有権限は解除されません）"
                                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-50"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800" />

            <div className="space-y-2">
                <h4 className="font-bold text-slate-600 dark:text-slate-300">担当エージェントと共有する</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    共有すると、エージェントがあなたの設定ファイルを直接上書きできるようになります。上書き後は「Driveから読み込む」で反映してください。
                </p>
                {sharedWithAgentEmail && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">現在の共有先: {sharedWithAgentEmail}</p>
                )}
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={newAgentEmail}
                        onChange={e => setNewAgentEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleShare(); }}
                        placeholder="agent@bloom-firm.com"
                        className={inputStyle}
                    />
                    <button type="button" onClick={handleShare} disabled={isBusy || !newAgentEmail.trim()} className={buttonStyle}>共有する</button>
                </div>
            </div>
        </div>
    );
};

export default TeamSyncPanel;
