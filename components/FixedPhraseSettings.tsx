
import React, { useEffect, useState } from 'react';
import { CopyGroup, FixedPhrase, PromptSection } from '../types';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface FixedPhraseSettingsProps {
    fixedPhrases: FixedPhrase[];
    promptSections: PromptSection[];
    groups: CopyGroup[];
    onSave: (phrases: FixedPhrase[]) => void;
}

const FixedPhraseSettings: React.FC<FixedPhraseSettingsProps> = ({ fixedPhrases, promptSections, groups, onSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localPhrases, setLocalPhrases] = useState<FixedPhrase[]>(fixedPhrases);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setLocalPhrases(fixedPhrases); }, [fixedPhrases]);

    const handleUpdate = (index: number, field: 'key' | 'value' | 'insertionPoint', value: string) => {
        setLocalPhrases(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const handleAdd = () => setLocalPhrases(prev => [...prev, { key: '', value: '', insertionPoint: 'none' }]);
    const handleRemove = (index: number) => setLocalPhrases(prev => prev.filter((_, i) => i !== index));

    const handleSave = () => {
        setIsSaving(true);
        onSave(localPhrases);
        setTimeout(() => setIsSaving(false), 2000);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between p-6 text-left">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">定型文設定</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        よく使う文章を登録しておくと、本文中に <code className="rounded bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5 text-xs text-cyan-600 dark:text-cyan-400">{'{プレースホルダー名}'}</code> で呼び出したり、指定した位置に自動で挿入したりできます。
                    </p>
                </div>
                <ChevronDownIcon className={`ml-4 h-6 w-6 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="space-y-6 px-6 pb-6">
                    <div className="space-y-4">
                        {localPhrases.map((phrase, index) => (
                            <div key={index} className="grid grid-cols-1 items-start gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 md:grid-cols-12 md:gap-4">
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">プレースホルダー名</label>
                                    <input type="text" value={phrase.key} onChange={e => handleUpdate(index, 'key', e.target.value)} placeholder="例: 企業紹介" className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                </div>
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">内容</label>
                                    <textarea rows={3} value={phrase.value} onChange={e => handleUpdate(index, 'value', e.target.value)} placeholder="例: 株式会社Sampleは..." className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">挿入位置</label>
                                    <div className="flex items-center gap-2">
                                        <select value={phrase.insertionPoint} onChange={e => handleUpdate(index, 'insertionPoint', e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                                            <option value="none">挿入しない（プレースホルダー利用）</option>
                                            {groups.map(g => (
                                                <option key={`group_start:${g.id}`} value={`group_start:${g.id}`}>『{g.label}』の冒頭に挿入</option>
                                            ))}
                                            {promptSections.filter(s => s.enabled && s.title.trim()).map(s => (
                                                <option key={s.id} value={s.id}>『{s.title}』の後ろに挿入</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => handleRemove(index)} className="mt-1 flex-shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-red-500">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                        <button type="button" onClick={handleAdd} className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            定型文を追加
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

export default FixedPhraseSettings;
