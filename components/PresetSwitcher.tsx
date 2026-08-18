
import React, { useState } from 'react';
import { usePresets, PresetTab } from '../contexts/PresetContext';
import TrashIcon from './icons/TrashIcon';

interface PresetSwitcherProps {
    tab: PresetTab;
}

const PresetSwitcher: React.FC<PresetSwitcherProps> = ({ tab }) => {
    const { presets, activePreset, setActivePresetId, addPreset, duplicatePreset, renamePreset, deletePreset } = usePresets();
    const current = activePreset(tab);
    const [isRenaming, setIsRenaming] = useState(false);
    const [nameDraft, setNameDraft] = useState(current.name);

    const startRename = () => {
        setNameDraft(current.name);
        setIsRenaming(true);
    };

    const commitRename = () => {
        const trimmed = nameDraft.trim();
        if (trimmed) renamePreset(current.id, trimmed);
        setIsRenaming(false);
    };

    const handleAdd = () => {
        const name = window.prompt('新しい媒体プリセット名を入力してください', '新しい媒体');
        if (!name || !name.trim()) return;
        const created = addPreset(name.trim());
        setActivePresetId(tab, created.id);
    };

    const handleDuplicate = () => {
        const created = duplicatePreset(current.id);
        if (created) setActivePresetId(tab, created.id);
    };

    const handleDelete = () => {
        if (presets.length <= 1) return;
        if (!window.confirm(`「${current.name}」を削除しますか？この操作は取り消せません。`)) return;
        deletePreset(current.id);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">媒体プリセット:</span>
            {isRenaming ? (
                <input
                    autoFocus
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                    className="px-2 py-1 text-sm rounded-md border border-cyan-400 bg-white dark:bg-slate-900 focus:outline-none"
                />
            ) : (
                <select
                    value={current.id}
                    onChange={e => setActivePresetId(tab, e.target.value)}
                    className="px-2 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                    {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}
            <button onClick={startRename} className="text-xs px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">改名</button>
            <button onClick={handleDuplicate} className="text-xs px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">複製</button>
            <button onClick={handleAdd} className="text-xs px-2 py-1 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40">+ 新規媒体</button>
            {presets.length > 1 && (
                <button onClick={handleDelete} className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="このプリセットを削除">
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default PresetSwitcher;
