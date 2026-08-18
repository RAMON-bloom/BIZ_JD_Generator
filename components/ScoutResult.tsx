
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import { EditableSection } from '../types';

interface GroupCopyTarget {
    id: number;
    label: string;
    text: string;
}

interface ScoutResultProps {
    sections: EditableSection[];
    onSectionChange: (sections: EditableSection[]) => void;
    groupTargets: GroupCopyTarget[];
    isLoading: boolean;
}

type ViewFormat = 'original' | 'line-break';

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-6 p-6">
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700/50 w-1/3"></div>
        <div className="space-y-3">
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700/50 w-full"></div>
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700/50 w-5/6"></div>
        </div>
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700/50 w-1/4 mt-6"></div>
        <div className="space-y-3">
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700/50 w-full"></div>
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700/50 w-4/6"></div>
        </div>
    </div>
);

const formatWithLineBreaks = (text: string, maxLength: number = 20): string => {
    if (!text) return '';
    return text.split('\n').map(line => {
        if (line.trim() === '' || line.match(/^[◤❶❷❸]/)) return line;
        const chunks = line.match(new RegExp(`(.{1,${maxLength}})`, 'g'));
        return chunks ? chunks.join('\n') : line;
    }).join('\n');
};

const EditableSectionField: React.FC<{ title: string; content: string; onChange: (v: string) => void }> = ({ title, content, onChange }) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [content]);

    return (
        <div className="space-y-2">
            <label className="font-semibold text-slate-500 dark:text-slate-400">{title}</label>
            <textarea
                ref={ref}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full resize-none overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/40 p-3 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 shadow-inner focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition"
                rows={1}
            />
        </div>
    );
};

const ScoutResult: React.FC<ScoutResultProps> = ({ sections, onSectionChange, groupTargets, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [viewFormat, setViewFormat] = useState<ViewFormat>('original');
    const [copiedGroupId, setCopiedGroupId] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && sections.length > 0) {
            setActiveTab('edit');
            setViewFormat('original');
            setCopiedGroupId(null);
        }
    }, [isLoading, sections]);

    const handleCopyGroup = (target: GroupCopyTarget) => {
        if (!target.text) return;
        navigator.clipboard.writeText(target.text);
        setCopiedGroupId(target.id);
        setTimeout(() => setCopiedGroupId(null), 2000);
    };

    const handleSectionChange = (index: number, newContent: string) => {
        onSectionChange(sections.map((s, i) => i === index ? { ...s, content: newContent } : s));
    };

    const previewText = groupTargets.map(g => g.text).filter(Boolean).join('\n\n');

    const renderContent = () => {
        if (isLoading) return <SkeletonLoader />;

        if (sections.length === 0) {
            return (
                <div className="flex h-full min-h-[300px] items-center justify-center p-6 text-slate-400 dark:text-slate-500">
                    <p>ここに生成されたスカウト文が表示されます。</p>
                </div>
            );
        }

        return (
            <>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 flex-wrap gap-2">
                    <div className="flex">
                        <TabButton label="編集モード" isActive={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
                        <TabButton label="プレビュー" isActive={activeTab === 'preview'} onClick={() => setActiveTab('preview')} />
                    </div>
                    <div className="flex flex-wrap gap-2 my-2">
                        {groupTargets.map(target => (
                            <button
                                key={target.id}
                                onClick={() => handleCopyGroup(target)}
                                disabled={!target.text}
                                className="group inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/60 py-1.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {copiedGroupId === target.id ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />}
                                <span className="ml-1.5">{copiedGroupId === target.id ? 'コピーしました' : `${target.label}をコピー`}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'preview' && previewText && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">表示形式:</span>
                            <ViewFormatButton label="オリジナル" isActive={viewFormat === 'original'} onClick={() => setViewFormat('original')} />
                            <ViewFormatButton label="改行あり (20文字)" isActive={viewFormat === 'line-break'} onClick={() => setViewFormat('line-break')} />
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="space-y-6 p-6">
                        {sections.map((section, index) => (
                            <EditableSectionField key={section.id} title={section.title} content={section.content} onChange={(v) => handleSectionChange(index, v)} />
                        ))}
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {viewFormat === 'line-break' ? formatWithLineBreaks(previewText) : previewText}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <h2 className="sr-only">生成結果</h2>
            {renderContent()}
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
        {label}
    </button>
);

const ViewFormatButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${isActive ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
        {label}
    </button>
);

export default ScoutResult;
