
import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import { SubjectData } from '../types';

interface SubjectResultProps {
    subjectData: SubjectData;
    isLoading: boolean;
    error?: string | null;
}

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse space-y-6">
        <div>
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700/50 mb-3"></div>
            <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>)}
            </div>
        </div>
        <div>
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700/50 mb-3"></div>
            <div className="space-y-3">
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                <div className="h-5 rounded bg-slate-200 dark:bg-slate-700/50"></div>
            </div>
        </div>
    </div>
);

const SubjectResult: React.FC<SubjectResultProps> = ({ subjectData, isLoading, error }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const renderContent = () => {
        if (isLoading) return <SkeletonLoader />;

        if (error) {
            return (
                <div className="flex flex-col h-full min-h-[250px] items-center justify-center text-center p-4 space-y-3">
                    <span className="text-amber-500 text-3xl">⚠️</span>
                    <p className="font-bold text-amber-600 dark:text-amber-300 text-sm">件名の自動生成をスキップしました</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px]">
                        APIの利用制限により件名取得が一時的に制限されました。<br />
                        <strong className="text-emerald-600 dark:text-emerald-400">※スカウト本文は正常に生成されています！</strong><br />
                        しばらく時間をおいてから、再度「生成」をクリックすると、件名も生成されます。
                    </p>
                </div>
            );
        }

        const { keywords, subjects } = subjectData;
        if (!keywords?.length && !subjects?.length) {
            return (
                <div className="flex h-full min-h-[300px] items-center justify-center text-slate-400 dark:text-slate-500">
                    <p>ここに件名案が表示されます。</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="mb-3 text-sm font-bold text-slate-500 dark:text-slate-400">キーワード案</h3>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                            <span key={index} className="rounded-full bg-cyan-100 dark:bg-cyan-900/50 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">{keyword}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="mb-3 text-sm font-bold text-slate-500 dark:text-slate-400">件名参考例</h3>
                    <ul className="space-y-2">
                        {subjects.map((subject, index) => (
                            <li key={index} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/60 dark:border-transparent">
                                <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{subject}</p>
                                <button onClick={() => handleCopy(subject, index)} className="group flex-shrink-0 rounded-md p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="件名をコピー">
                                    {copiedIndex === index ? <CheckIcon className="h-5 w-5 text-green-500" /> : <ClipboardIcon className="h-5 w-5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="sticky top-24">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-gray-950 p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                <h2 className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-lg font-bold text-slate-800 dark:text-white">スカウト件名案</h2>
                <div className="min-h-[300px]">{renderContent()}</div>
            </div>
        </div>
    );
};

export default SubjectResult;
