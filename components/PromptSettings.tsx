
import React, { useEffect, useState } from 'react';
import { CopyGroup, PromptSection } from '../types';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface PromptSettingsProps {
    promptSections: PromptSection[];
    groups: CopyGroup[];
    onSave: (sections: PromptSection[]) => void;
}

const PromptSettings: React.FC<PromptSettingsProps> = ({ promptSections, groups, onSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localSections, setLocalSections] = useState<PromptSection[]>(promptSections);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setLocalSections(promptSections); }, [promptSections]);

    const handleUpdate = (index: number, updates: Partial<PromptSection>) => {
        setLocalSections(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
    };

    const handleAdd = () => {
        setLocalSections(prev => [...prev, {
            id: Date.now().toString(),
            title: '新規セクション',
            instruction: '{ここに内容を記述}',
            enabled: true,
            group: groups[0]?.id ?? 0,
            order: prev.length,
        }]);
    };

    const handleRemove = (index: number) => {
        setLocalSections(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= localSections.length) return;
        const next = [...localSections];
        [next[index], next[target]] = [next[target], next[index]];
        setLocalSections(next.map((s, i) => ({ ...s, order: i })));
    };

    const handleSave = () => {
        setIsSaving(true);
        onSave(localSections);
        setTimeout(() => setIsSaving(false), 2000);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between p-6 text-left">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">生成テンプレート設定</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">スカウト文の構成（タイトルや生成指示、コピーグループ）を自由に編集できます。</p>
                </div>
                <ChevronDownIcon className={`ml-4 h-6 w-6 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="space-y-6 px-6 pb-6">
                    <div className="space-y-4">
                        {localSections.map((section, index) => (
                            <div key={section.id} className="grid grid-cols-1 items-start gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 md:grid-cols-12 md:gap-x-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">タイトル</label>
                                    <input type="text" value={section.title} onChange={e => handleUpdate(index, { title: e.target.value })} placeholder="例: ◤ご連絡の背景◢" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">生成内容の指示</label>
                                    <textarea rows={4} value={section.instruction} onChange={e => handleUpdate(index, { instruction: e.target.value })} placeholder="例: {ここに連絡の背景を記述}" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">コピーグループ</label>
                                    <select value={section.group} onChange={e => handleUpdate(index, { group: Number(e.target.value) })} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-start justify-end gap-1 md:col-span-2 md:mt-6">
                                    <label className="flex cursor-pointer items-center space-x-2 rounded-md p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                        <input type="checkbox" checked={section.enabled} onChange={e => handleUpdate(index, { enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-500" />
                                        <span className="text-xs font-semibold select-none">有効</span>
                                    </label>
                                    <div className="flex flex-col">
                                        <button type="button" onClick={() => handleMove(index, 'up')} disabled={index === 0} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">
                                            <ArrowUpIcon className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => handleMove(index, 'down')} disabled={index === localSections.length - 1} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">
                                            <ArrowDownIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => handleRemove(index)} className="flex-shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-red-500">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                        <button type="button" onClick={handleAdd} className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            セクションを追加
                        </button>
                        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-cyan-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700">
                            {isSaving ? '保存しました！' : '設定を保存'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptSettings;
