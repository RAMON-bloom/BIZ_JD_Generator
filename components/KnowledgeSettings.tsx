
import React, { useEffect, useState } from 'react';
import { SuccessKnowledge } from '../types';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface KnowledgeSettingsProps {
    knowledge: SuccessKnowledge;
    onSave: (knowledge: SuccessKnowledge) => void;
}

const KnowledgeSettings: React.FC<KnowledgeSettingsProps> = ({ knowledge, onSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [local, setLocal] = useState<SuccessKnowledge>(knowledge);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setLocal(knowledge); }, [knowledge]);

    const addSubject = () => setLocal(prev => ({ ...prev, subjects: [...prev.subjects, ''] }));
    const updateSubject = (i: number, v: string) => setLocal(prev => ({ ...prev, subjects: prev.subjects.map((s, idx) => idx === i ? v : s) }));
    const removeSubject = (i: number) => setLocal(prev => ({ ...prev, subjects: prev.subjects.filter((_, idx) => idx !== i) }));

    const addStructure = () => setLocal(prev => ({ ...prev, structures: [...prev.structures, { title: '', content: '' }] }));
    const updateStructure = (i: number, field: 'title' | 'content', v: string) => setLocal(prev => ({ ...prev, structures: prev.structures.map((s, idx) => idx === i ? { ...s, [field]: v } : s) }));
    const removeStructure = (i: number) => setLocal(prev => ({ ...prev, structures: prev.structures.filter((_, idx) => idx !== i) }));

    const handleSave = () => {
        setIsSaving(true);
        onSave(local);
        setTimeout(() => setIsSaving(false), 2000);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between p-6 text-left">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">成功事例ナレッジ</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">これまでに返信の多かった件名やスカウト構成を登録します。AIはこれらの事例を「成功パターン」として学習し、生成に反映させます。</p>
                </div>
                <ChevronDownIcon className={`ml-4 h-6 w-6 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="space-y-8 px-6 pb-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <div>
                        <h3 className="text-base font-semibold text-cyan-600 dark:text-cyan-400 mb-4">返信率が高かった件名案</h3>
                        <div className="space-y-3">
                            {local.subjects.map((subject, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={subject} onChange={e => updateSubject(i, e.target.value)} placeholder="例: 【ご経歴拝見】Reactエキスパートの募集 / 月収〇〇万〜" className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                    <button onClick={() => removeSubject(i)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-red-500">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addSubject} className="mt-2 text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">+ 件名事例を追加</button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-cyan-600 dark:text-cyan-400 mb-4">効果的だった構成・フレーズ</h3>
                        <div className="space-y-6">
                            {local.structures.map((structure, i) => (
                                <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/30">
                                    <div className="flex justify-between mb-4">
                                        <input type="text" value={structure.title} onChange={e => updateStructure(i, 'title', e.target.value)} placeholder="事例のタイトル（例: 年収提示が効いたパターン）" className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none mr-4" />
                                        <button onClick={() => removeStructure(i)} className="text-slate-400 hover:text-red-500">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <textarea rows={4} value={structure.content} onChange={e => updateStructure(i, 'content', e.target.value)} placeholder="具体的な文章や構成のポイントを記入してください" className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                                </div>
                            ))}
                            <button type="button" onClick={addStructure} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">+ 構成事例を追加</button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-md bg-cyan-500 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-cyan-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700">
                            {isSaving ? 'ナレッジを保存しました！' : 'ナレッジを保存'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeSettings;
